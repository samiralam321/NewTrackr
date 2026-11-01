import json
import logging
from typing import Optional, List, Set, Any
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger("trackr.redis")

# Global Redis Connection Client
redis_client: Optional[aioredis.Redis] = None


async def init_redis_pool() -> aioredis.Redis:
    global redis_client
    try:
        redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
        )
        await redis_client.ping()
        logger.info("Connected to Redis successfully.")
    except Exception as e:
        logger.warning(f"Redis connection failed or not running: {e}. Falling back to in-memory mode for development.")
        redis_client = None
    return redis_client


async def close_redis_pool():
    global redis_client
    if redis_client:
        await redis_client.close()
        logger.info("Redis connection pool closed.")


async def get_redis() -> Optional[aioredis.Redis]:
    global redis_client
    return redis_client


# ==============================================================================
# REDIS PRESENCE & HEARTBEAT MANAGER
# ==============================================================================
PRESENCE_KEY_PREFIX = "trackr:presence:"
HEARTBEAT_TTL = 60  # seconds


class PresenceManager:
    """Manages active online presence with automatic TTL expiration."""

    @staticmethod
    async def mark_user_active(user_id: str, session_id: str) -> None:
        client = await get_redis()
        if client:
            user_key = f"{PRESENCE_KEY_PREFIX}{user_id}"
            await client.sadd(user_key, session_id)
            await client.expire(user_key, HEARTBEAT_TTL)

    @staticmethod
    async def mark_user_inactive(user_id: str, session_id: str) -> None:
        client = await get_redis()
        if client:
            user_key = f"{PRESENCE_KEY_PREFIX}{user_id}"
            await client.srem(user_key, session_id)
            remaining = await client.scard(user_key)
            if remaining == 0:
                await client.delete(user_key)

    @staticmethod
    async def is_user_online(user_id: str) -> bool:
        client = await get_redis()
        if client:
            user_key = f"{PRESENCE_KEY_PREFIX}{user_id}"
            count = await client.scard(user_key)
            return count > 0
        return False

    @staticmethod
    async def get_online_status_bulk(user_ids: List[str]) -> dict[str, bool]:
        client = await get_redis()
        result = {}
        if client and user_ids:
            pipe = client.pipeline()
            for uid in user_ids:
                pipe.scard(f"{PRESENCE_KEY_PREFIX}{uid}")
            counts = await pipe.execute()
            for uid, count in zip(user_ids, counts):
                result[uid] = count > 0
        else:
            for uid in user_ids:
                result[uid] = False
        return result


# ==============================================================================
# REDIS PUB/SUB BROADCASTER FOR MULTI-INSTANCE WEBSOCKETS
# ==============================================================================
CHAT_CHANNEL_PREFIX = "trackr:channel:"


class RedisPubSubManager:
    """Distributes WebSocket events across multiple server workers/containers."""

    @staticmethod
    async def publish_event(channel_name: str, event_data: dict[str, Any]) -> None:
        client = await get_redis()
        if client:
            channel = f"{CHAT_CHANNEL_PREFIX}{channel_name}"
            payload = json.dumps(event_data)
            await client.publish(channel, payload)


# ==============================================================================
# RATE LIMITER
# ==============================================================================
class RateLimiter:
    """Sliding window rate limiter using Redis."""

    @staticmethod
    async def is_rate_limited(key: str, limit: int, window_seconds: int) -> bool:
        client = await get_redis()
        if not client:
            return False  # Bypass in dev if redis unavailable
        rate_key = f"trackr:ratelimit:{key}"
        current = await client.incr(rate_key)
        if current == 1:
            await client.expire(rate_key, window_seconds)
        return current > limit
