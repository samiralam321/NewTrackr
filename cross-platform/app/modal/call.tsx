import React from 'react'
import { View, Text, Pressable, StyleSheet, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useCallStore } from '../../store/presenceStore'
import { Colors } from '../../theme/colors'
import { wsService } from '../../services/websocket'

export default function CallModal() {
  const router = useRouter()
  const { activeCall, isMuted, isVideoEnabled, toggleMute, toggleVideo, endCall, setCallStatus } = useCallStore()

  if (!activeCall) {
    return null
  }

  const handleAccept = () => {
    setCallStatus('connected')
    wsService.send({
      type: 'call_accepted',
      target_user_id: activeCall.targetUserId,
    })
  }

  const handleDecline = () => {
    wsService.send({
      type: 'call_rejected',
      target_user_id: activeCall.targetUserId,
    })
    endCall()
    router.back()
  }

  const handleHangup = () => {
    wsService.send({
      type: 'call_ended',
      target_user_id: activeCall.targetUserId,
    })
    endCall()
    router.back()
  }

  return (
    <View style={styles.container}>
      {/* Remote Video / Audio Placeholder Canvas */}
      <View style={styles.mediaCanvas}>
        <Image
          source={{ uri: activeCall.targetUserAvatar || `https://ui-avatars.com/api/?name=${activeCall.targetUserName}&background=7C3AED&color=fff` }}
          style={styles.avatarLarge}
        />
        <Text style={styles.callerName}>{activeCall.targetUserName}</Text>
        <Text style={styles.callStatus}>
          {activeCall.status === 'ringing'
            ? activeCall.isIncoming ? 'Incoming Call...' : 'Ringing...'
            : 'Connected • WebRTC Encrypted'}
        </Text>
      </View>

      {/* Call Actions Bar */}
      {activeCall.status === 'ringing' && activeCall.isIncoming ? (
        <View style={styles.incomingControls}>
          <Pressable onPress={handleDecline} style={[styles.circleBtn, styles.declineBtn]}>
            <Ionicons name="call" size={24} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
          </Pressable>
          <Pressable onPress={handleAccept} style={[styles.circleBtn, styles.acceptBtn]}>
            <Ionicons name="call" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        <View style={styles.activeControls}>
          <Pressable onPress={toggleMute} style={[styles.circleBtn, isMuted && styles.circleBtnActive]}>
            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={22} color="#FFFFFF" />
          </Pressable>

          <Pressable onPress={toggleVideo} style={[styles.circleBtn, !isVideoEnabled && styles.circleBtnActive]}>
            <Ionicons name={isVideoEnabled ? 'videocam' : 'videocam-off'} size={22} color="#FFFFFF" />
          </Pressable>

          <Pressable onPress={handleHangup} style={[styles.circleBtn, styles.declineBtn]}>
            <Ionicons name="call" size={24} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07060A',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  mediaCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.dark.primary,
  },
  callerName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  callStatus: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  incomingControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingBottom: 20,
  },
  activeControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
    paddingBottom: 20,
  },
  circleBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  acceptBtn: {
    backgroundColor: '#10B981',
  },
  declineBtn: {
    backgroundColor: '#EF4444',
  },
})
