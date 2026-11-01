import logging
from typing import Any, Dict
from app.websockets.connection_manager import ws_manager

logger = logging.getLogger("trackr.webrtc")


class WebRTCSignalingHandler:
    """Coordinates WebRTC SDP offer/answer and ICE candidate exchange between peers."""

    @staticmethod
    async def handle_signaling_event(sender_id: str, payload: Dict[str, Any]):
        event_type = payload.get("type")
        target_id = payload.get("target_user_id")

        if not target_id or not event_type:
            return

        logger.debug(f"WebRTC Signaling: {event_type} from {sender_id} -> {target_id}")

        # Forward signal directly to recipient peer over WebSocket
        signal_forward = {
            "type": f"webrtc_{event_type}",
            "sender_id": sender_id,
            "data": payload.get("data", {}),
            "media_type": payload.get("media_type", "video"),  # 'audio' or 'video'
        }

        await ws_manager.broadcast_event(target_id, signal_forward["type"], signal_forward)
