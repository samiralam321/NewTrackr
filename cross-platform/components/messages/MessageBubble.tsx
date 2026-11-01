import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Message } from '../../types'
import { Colors } from '../../theme/colors'

interface MessageBubbleProps {
  message: Message
  isMe: boolean
}

export function MessageBubble({ message, isMe }: MessageBubbleProps) {
  const isImage = message.content.startsWith('[IMAGE]: ')
  const imageUrl = isImage ? message.content.replace('[IMAGE]: ', '') : null

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <View style={[styles.container, isMe ? styles.containerMe : styles.containerOther]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        {isImage && imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.imageAttachment} resizeMode="cover" />
        ) : (
          <Text style={[styles.text, isMe ? styles.textMe : styles.textOther]}>
            {message.content}
          </Text>
        )}
      </View>

      <View style={[styles.metaRow, isMe && { justifyContent: 'flex-end' }]}>
        <Text style={styles.timeText}>{formatTime(message.created_at)}</Text>
        {isMe && (
          <Ionicons
            name={message.is_read ? 'checkmark-done' : 'checkmark'}
            size={13}
            color={message.is_read ? Colors.dark.primary : Colors.dark.textMuted}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '82%',
  },
  containerMe: {
    alignSelf: 'flex-end',
  },
  containerOther: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: Colors.dark.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.dark.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  textMe: {
    color: '#FFFFFF',
  },
  textOther: {
    color: Colors.dark.textPrimary,
  },
  imageAttachment: {
    width: 220,
    height: 180,
    borderRadius: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 10,
    color: Colors.dark.textMuted,
  },
})
