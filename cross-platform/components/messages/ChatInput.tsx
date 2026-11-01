import React, { useState, useRef } from 'react'
import { View, TextInput, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { Colors } from '../../theme/colors'
import { wsService } from '../../services/websocket'

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>
  targetUserId: string
  targetUserName: string
}

export function ChatInput({ onSendMessage, targetUserId, targetUserName }: ChatInputProps) {
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const typingTimeoutRef = useRef<any>(null)

  const handleTextChange = (val: string) => {
    setText(val)

    // Broadcast live typing over WebSocket with 2s debounce
    wsService.sendTyping(targetUserId, true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      wsService.sendTyping(targetUserId, false)
    }, 2000)
  }

  const handleSend = async () => {
    if (!text.trim() || isSending) return
    const msg = text.trim()
    setText('')
    setIsSending(true)

    try {
      await onSendMessage(msg)
    } finally {
      setIsSending(false)
    }
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]?.uri) {
      onSendMessage(`[IMAGE]: ${result.assets[0].uri}`)
    }
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={pickImage} style={styles.actionBtn}>
        <Ionicons name="image-outline" size={21} color={Colors.dark.textSecondary} />
      </Pressable>

      <TextInput
        value={text}
        onChangeText={handleTextChange}
        placeholder={`Message ${targetUserName}...`}
        placeholderTextColor={Colors.dark.textMuted}
        multiline
        style={styles.textInput}
      />

      <Pressable
        onPress={handleSend}
        disabled={!text.trim() || isSending}
        style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons name="send" size={16} color="#FFFFFF" />
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
    gap: 8,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.dark.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#FFFFFF',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },
})
