import { useAuthStore } from '../store/authStore'
import { usePresenceStore, useCallStore } from '../store/presenceStore'

const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL || "wss://trackr-ten-eta.vercel.app/ws"

type MessageHandler = (message: any) => void

class WebSocketService {
  private socket: WebSocket | null = null
  private listeners: Set<MessageHandler> = new Set()
  private reconnectAttempts = 0
  private pingInterval: any = null

  public connect() {
    const token = useAuthStore.getState().token
    if (!token || this.socket) return

    const wsUrl = `${WS_BASE_URL}?token=${encodeURIComponent(token)}`
    this.socket = new WebSocket(wsUrl)

    this.socket.onopen = () => {
      this.reconnectAttempts = 0
      // Send periodic heartbeat ping
      this.pingInterval = setInterval(() => {
        this.send({ type: 'ping' })
      }, 30000)
    }

    this.socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        const { type, data } = payload

        // 1. Live Chat Message received
        if (type === 'chat_message') {
          this.notifyListeners(payload)
        }

        // 2. Real-time Typing Indicator
        else if (type === 'user_typing') {
          usePresenceStore.getState().setUserTyping(data.sender_id, data.is_typing)
        }

        // 3. WebRTC Incoming Call Request
        else if (type === 'webrtc_call_request') {
          useCallStore.getState().startCall({
            targetUserId: payload.sender_id,
            targetUserName: data.caller_name || 'Student',
            targetUserAvatar: data.caller_avatar,
            isIncoming: true,
            mediaType: payload.media_type || 'video',
            status: 'ringing'
          })
        }

        // 4. WebRTC Call Events (Accept, Reject, Ended)
        else if (type && type.startsWith('webrtc_')) {
          this.notifyListeners(payload)
        }
      } catch (err) {
        console.warn('Failed to parse WebSocket message:', err)
      }
    }

    this.socket.onclose = () => {
      this.cleanup()
      // Exponential backoff reconnect
      const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 15000)
      this.reconnectAttempts++
      setTimeout(() => this.connect(), timeout)
    }

    this.socket.onerror = (err) => {
      console.warn('WebSocket error:', err)
      this.socket?.close()
    }
  }

  public send(event: object) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(event))
    }
  }

  public sendTyping(targetUserId: string, isTyping: boolean) {
    this.send({
      type: 'typing',
      target_user_id: targetUserId,
      is_typing: isTyping
    })
  }

  public addListener(handler: MessageHandler) {
    this.listeners.add(handler)
    return () => this.listeners.delete(handler)
  }

  private notifyListeners(message: any) {
    this.listeners.forEach(cb => cb(message))
  }

  public disconnect() {
    this.cleanup()
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }
}

export const wsService = new WebSocketService()
