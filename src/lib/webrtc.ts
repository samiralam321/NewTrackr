/**
 * WebRTC Peer Connection & Signaling Helper
 * Uses Supabase Realtime Broadcast as the signaling channel for direct peer-to-peer communication.
 */

export type SignalingMessage = 
  | { type: 'offer'; sdp: RTCSessionDescriptionInit; senderId: string }
  | { type: 'answer'; sdp: RTCSessionDescriptionInit; senderId: string }
  | { type: 'candidate'; candidate: RTCIceCandidateInit; senderId: string }
  | { type: 'call_request'; callerName: string; callerAvatar?: string; senderId: string; isVideo: boolean }
  | { type: 'call_accepted'; senderId: string }
  | { type: 'call_rejected'; senderId: string }
  | { type: 'call_ended'; senderId: string }

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export class WebRTCPeerSession {
  private peer: RTCPeerConnection | null = null
  private onRemoteTrackCallback?: (stream: MediaStream) => void
  private sendSignalCallback: (msg: SignalingMessage) => void
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream = new MediaStream()

  constructor(sendSignal: (msg: SignalingMessage) => void) {
    this.sendSignalCallback = sendSignal
  }

  public setOnRemoteStream(cb: (stream: MediaStream) => void) {
    this.onRemoteTrackCallback = cb
  }

  public async initPeer(currentUserId: string, localMediaStream?: MediaStream) {
    if (typeof window === 'undefined' || !window.RTCPeerConnection) return null

    this.localStream = localMediaStream || null
    this.peer = new RTCPeerConnection(ICE_SERVERS)

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.localStream && this.peer) {
          this.peer.addTrack(track, this.localStream)
        }
      })
    }

    this.peer.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream.addTrack(track)
      })
      if (this.onRemoteTrackCallback) {
        this.onRemoteTrackCallback(this.remoteStream)
      }
    }

    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalCallback({
          type: 'candidate',
          candidate: event.candidate.toJSON(),
          senderId: currentUserId,
        })
      }
    }

    return this.peer
  }

  public async createOffer(currentUserId: string): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peer) return null
    try {
      const offer = await this.peer.createOffer()
      await this.peer.setLocalDescription(offer)
      this.sendSignalCallback({
        type: 'offer',
        sdp: offer,
        senderId: currentUserId,
      })
      return offer
    } catch (err) {
      console.error('Error creating WebRTC offer:', err)
      return null
    }
  }

  public async handleOffer(offer: RTCSessionDescriptionInit, currentUserId: string): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peer) return null
    try {
      await this.peer.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await this.peer.createAnswer()
      await this.peer.setLocalDescription(answer)
      this.sendSignalCallback({
        type: 'answer',
        sdp: answer,
        senderId: currentUserId,
      })
      return answer
    } catch (err) {
      console.error('Error handling WebRTC offer:', err)
      return null
    }
  }

  public async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peer) return
    try {
      await this.peer.setRemoteDescription(new RTCSessionDescription(answer))
    } catch (err) {
      console.error('Error handling WebRTC answer:', err)
    }
  }

  public async handleCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peer) return
    try {
      await this.peer.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (err) {
      console.error('Error adding ICE candidate:', err)
    }
  }

  public close() {
    if (this.peer) {
      this.peer.close()
      this.peer = null
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }
  }
}
