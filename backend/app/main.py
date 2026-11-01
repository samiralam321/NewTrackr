import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.redis import init_redis_pool, close_redis_pool
from app.core.security import decode_token
from app.websockets.connection_manager import ws_manager
from app.websockets.signaling import WebRTCSignalingHandler
from app.api.v1.router import api_router

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("trackr.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Redis pool & subscribe to cluster events
    logger.info("Initializing Trackr API services...")
    await init_redis_pool()
    await ws_manager.start_redis_listener()
    yield
    # Shutdown: Close Redis connections
    logger.info("Shutting down Trackr API services...")
    await close_redis_pool()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


# ==============================================================================
# UNIFIED REAL-TIME WEBSOCKET GATEWAY (Messaging, Typing, Presence & WebRTC)
# ==============================================================================
@app.websocket("/ws")
async def websocket_gateway(
    websocket: WebSocket,
    token: str = Query(...)
):
    # Authenticate WebSocket connection
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = str(payload.get("sub") or payload.get("user_id"))
    session_id = await ws_manager.connect(user_id, websocket)

    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                event = json.loads(raw_text)
                event_type = event.get("type")

                # 1. Typing status indicator
                if event_type == "typing":
                    target_id = event.get("target_user_id")
                    if target_id:
                        await ws_manager.broadcast_event(
                            target_id, 
                            "user_typing", 
                            {"sender_id": user_id, "is_typing": event.get("is_typing", True)}
                        )

                # 2. WebRTC Audio/Video Call Signaling
                elif event_type and event_type.startswith("call_"):
                    await WebRTCSignalingHandler.handle_signaling_event(user_id, event)

                # 3. WebRTC SDP & ICE Candidate Exchange
                elif event_type in ("offer", "answer", "candidate"):
                    await WebRTCSignalingHandler.handle_signaling_event(user_id, event)

                # 4. Heartbeat ping
                elif event_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))

            except json.JSONDecodeError:
                logger.warning(f"Malformed WebSocket payload received from {user_id}")

    except WebSocketDisconnect:
        await ws_manager.disconnect(user_id, websocket, session_id)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        await ws_manager.disconnect(user_id, websocket, session_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
