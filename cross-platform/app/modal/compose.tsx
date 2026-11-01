import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

const CATEGORIES = [
  { id: 'Learned', label: '💡 Learned' },
  { id: 'Built', label: '🚀 Built' },
  { id: 'Practiced', label: '🎯 Practiced' },
  { id: 'Other', label: '📝 Other' },
] as const

const QUICK_EMOJIS = ['🚀', '💡', '🎯', '💻', '🔥', '📚', '✨', '🧠']

export default function ComposeModal() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  const [content, setContent] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'Learned' | 'Built' | 'Practiced' | 'Other'>('Learned')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePost = async () => {
    if (!content.trim() || isSubmitting) return
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await api.createPost(content.trim(), selectedCategory, [], imageUri || undefined)
      await queryClient.invalidateQueries({ queryKey: ['feed'] })
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }
      router.back()
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not post progress. Please try again.')
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]?.uri) {
        setImageUri(result.assets[0].uri)
      }
    } catch (e) {
      console.warn('Image picker canceled or failed:', e)
    }
  }

  const handleAddEmoji = (emoji: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    setContent((prev) => prev + emoji)
  }

  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 16 : 24)
  const bottomInset = Math.max(insets.bottom, 12)

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      style={[styles.container, { paddingTop: topInset, paddingBottom: bottomInset }]}
    >
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={10}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.topBarTitle}>Share Progress</Text>

        <View style={styles.topBarRight}>
          <Text style={styles.charCounter}>{content.length} / 500</Text>
          <Pressable
            onPress={handlePost}
            disabled={!content.trim() || isSubmitting}
            style={[styles.postBtn, (!content.trim() || isSubmitting) && styles.postBtnDisabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.postBtnText}>Post</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Error Notice Banner */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#EF4444" />
          <Text style={styles.errorText} numberOfLines={2}>
            {errorMessage}
          </Text>
          <Pressable onPress={() => setErrorMessage(null)} hitSlop={8}>
            <Ionicons name="close" size={16} color="#94A3B8" />
          </Pressable>
        </View>
      )}

      {/* Category Pills Bar */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  }
                  setSelectedCategory(cat.id)
                }}
                style={[styles.catPill, isSelected && styles.catPillActive]}
              >
                <Text style={[styles.catText, isSelected && styles.catTextActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      {/* Editor Content Area */}
      <ScrollView
        style={styles.editorScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.canvas}>
          <Image
            source={{
              uri:
                user?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}&background=7C3AED&color=fff`,
            }}
            style={styles.avatar}
          />
          <View style={styles.editorWrapper}>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="What did you learn, build, or practice today?"
              placeholderTextColor="#64748B"
              multiline
              autoFocus
              maxLength={500}
              style={styles.textInput}
            />

            {imageUri && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                <Pressable onPress={() => setImageUri(null)} style={styles.removeImgBtn} hitSlop={6}>
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Accessory Toolbar */}
      <View style={styles.bottomToolbar}>
        {/* Media Attach Button */}
        <Pressable onPress={handlePickImage} style={styles.mediaBtn} hitSlop={8}>
          <Ionicons name="image-outline" size={22} color="#8B5CF6" />
          <Text style={styles.mediaBtnText}>{imageUri ? 'Change Image' : 'Add Photo'}</Text>
        </Pressable>

        {/* Quick Emoji Strip */}
        <View style={styles.emojiStrip}>
          {QUICK_EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => handleAddEmoji(emoji)}
              style={styles.emojiBtn}
              hitSlop={4}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0C13',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  charCounter: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  postBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  postBtnDisabled: {
    opacity: 0.35,
  },
  postBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    color: '#FCA5A5',
  },
  categoryContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#12111A',
    paddingVertical: 10,
  },
  categoryRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  catPillActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#A78BFA',
  },
  catText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  catTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  editorScroll: {
    flex: 1,
  },
  canvas: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  editorWrapper: {
    flex: 1,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    textAlignVertical: 'top',
    minHeight: 160,
  },
  previewContainer: {
    position: 'relative',
    marginTop: 14,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewImage: {
    width: '100%',
    height: 220,
  },
  removeImgBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#100F17',
  },
  mediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
  },
  mediaBtnText: {
    fontSize: 12,
    color: '#A78BFA',
    fontWeight: '600',
  },
  emojiStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emojiBtn: {
    padding: 4,
  },
  emojiText: {
    fontSize: 18,
  },
})
