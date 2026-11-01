import asyncio
import json
import logging
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket
from app.core.redis import PresenceManager, RedisPubSubManager, get_redis

logger = logging.getLogger("trackr.websockets")


class ConnectionManager:
    """High-performance WebSocket connection registry with Redis Pub/Sub integration."""

    def __init__(self):
        # Maps user_id -> set of active WebSockets (supports multiple devices/tabs per user)
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.pubsub_task: Optional[asyncio.Task] = None

    async def connect(self, user_id: str, websocket: WebSocket) -> str:
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

        session_id = str(id(websocket))
        await PresenceManager.mark_user_active(user_id, session_id)
        logger.info(f"User {user_id} connected (Session {session_id}). Total sockets: {len(self.active_connections[user_id])}")
        return session_id

    async def disconnect(self, user_id: str, websocket: WebSocket, session_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

        await PresenceManager.mark_user_inactive(user_id, session_id)
        logger.info(f"User {user_id} disconnected (Session {session_id}).")

    async def send_personal_message(self, user_id: str, message: dict[str, Any]):
        """Sends an event to all connected sockets of a specific user on this instance."""
        if user_id in self.active_connections:
            payload = json.dumps(message)
            stale_sockets = []
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(payload)
                except Exception:
                    stale_sockets.append(ws)
            for dead in stale_sockets:
                self.active_connections[user_id].discard(dead)

    async def broadcast_event(self, target_user_id: str, event_type: str, data: dict[str, Any]):
        """Broadcasts event across all backend instances via Redis Pub/Sub."""
        event_payload = {
            "target_user_id": target_user_id,
            "type": event_type,
            "data": data,
        }
        # Publish to Redis so all container instances deliver to their local sockets
        await RedisPubSubManager.publish_event("cluster_events", event_payload)

        # Also immediately deliver locally
        await self.send_personal_message(target_user_id, {"type": event_type, "data": data})

    async def start_redis_listener(self):
        """Background worker listening for cross-instance events from Redis Pub/Sub."""
        redis_client = await get_redis()
        if not redis_client:
            return

        pubsub = redis_client.pubsub()
        await pubsub.subscribe("trackr:channel:cluster_events")

        async def listen():
            try:
                async for message in pubsub.listen():
                    if message["type"] == "message":
                        try:
                            payload = json.loads(message["data"])
                            target_id = payload.get("target_user_id")
                            if target_id and target_id in self.active_connections:
                                await self.send_personal_message(
                                    target_id, 
                                    {"type": payload.get("type"), "data": payload.get("data")}
                                )
                        except Exception as parse_err:
                            logger.error(f"Error parsing Redis cluster event: {parse_err}")
            except asyncio.CancelledError:
                await pubsub.unsubscribe("trackr:channel:cluster_events")

        self.pubsub_task = asyncio.create_task(listen())


ws_manager = ConnectionManager()
