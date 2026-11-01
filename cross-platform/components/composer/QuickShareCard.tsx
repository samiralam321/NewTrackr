import React, { useState } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  StyleSheet, 
  ActivityIndicator,
  Image,
  Platform
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { Colors } from '../../theme/colors'
import { api } from '../../services/api'

interface QuickShareCardProps {
  onPostCreated?: () => void
}

export function QuickShareCard({ onPostCreated }: QuickShareCardProps) {
  const [content, setContent] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'Learned' | 'Built' | 'Practiced' | 'Other'>('Learned')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const categories = [
    { id: 'Learned', label: 'Learned', icon: '💡' },
    { id: 'Built', label: 'Built', icon: '🚀' },
    { id: 'Practiced', label: 'Practiced', icon: '🎯' },
    { id: 'Other', label: 'Other', icon: '📝' },
  ] as const

  const quickEmojis = ['🔥', '🚀', '💡', '💻', '✅', '🎉', '🧠', '✨', '🎯', '⚡']

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]?.uri) {
        setSelectedImage(result.assets[0].uri)
      }
    } catch (err) {
      console.warn('Image picker error:', err)
    }
  }

  const handlePost = async () => {
    const trimmed = content.trim()
    if ((!trimmed && !selectedImage) || isSubmitting) return
    setIsSubmitting(true)
    setFeedback(null)

    try {
      await api.createPost(trimmed, selectedCategory, selectedImage || undefined)
      setContent('')
      setSelectedImage(null)
      setShowEmojiPicker(false)
      setFeedback('Progress shared!')
      setTimeout(() => setFeedback(null), 3000)
      if (onPostCreated) onPostCreated()
    } catch (err) {
      console.error('Failed to create post:', err)
      setFeedback('Failed to post. Try again.')
      setTimeout(() => setFeedback(null), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji)
  }

  const isValid = (content.trim().length > 0 || selectedImage !== null) && !isSubmitting

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIconWrapper}>
            <Ionicons name="sparkles" size={14} color={Colors.dark.primary} />
          </View>
          <Text style={styles.headerTitle}>Share your progress</Text>
        </View>
        <Text style={styles.headerSubtitle}>What did you accomplish today?</Text>
      </View>

      {/* Categories (Grid with zero clipping) */}
      <View style={styles.categoryGrid}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id as any)}
              style={[
                styles.categoryPill,
                isSelected ? styles.categoryPillActive : styles.categoryPillInactive,
              ]}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  isSelected ? styles.categoryLabelActive : styles.categoryLabelInactive,
                ]}
                numberOfLines={1}
              >
                {cat.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {/* Auto-growing Text Input Container */}
      <View style={styles.inputContainer}>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Share what you accomplished today..."
          placeholderTextColor={Colors.dark.textMuted}
          multiline
          style={styles.textInput}
          maxLength={1000}
        />

        {/* Attached Image Preview */}
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <Pressable
              onPress={() => setSelectedImage(null)}
              style={styles.removeImageBtn}
              accessibilityLabel="Remove attached image"
            >
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        )}
      </View>

      {/* Quick Emoji Bar (Collapsible) */}
      {showEmojiPicker && (
        <View style={styles.emojiPicker}>
          {quickEmojis.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => insertEmoji(emoji)}
              style={styles.emojiBtn}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Footer Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.mediaActions}>
          <Pressable 
            onPress={handlePickImage} 
            style={({ pressed }) => [styles.toolBtn, pressed && styles.toolBtnPressed]}
            accessibilityLabel="Attach image"
          >
            <Ionicons 
              name={selectedImage ? "image" : "image-outline"} 
              size={18} 
              color={selectedImage ? Colors.dark.primary : Colors.dark.textSecondary} 
            />
          </Pressable>

          <Pressable 
            onPress={() => setShowEmojiPicker(!showEmojiPicker)} 
            style={({ pressed }) => [
              styles.toolBtn, 
              showEmojiPicker && styles.toolBtnActive,
              pressed && styles.toolBtnPressed
            ]}
            accessibilityLabel="Insert emoji"
          >
            <Ionicons 
              name={showEmojiPicker ? "happy" : "happy-outline"} 
              size={18} 
              color={showEmojiPicker ? Colors.dark.primary : Colors.dark.textSecondary} 
            />
          </Pressable>
        </View>

        <View style={styles.actionRight}>
          {feedback && (
            <Text style={styles.feedbackText}>{feedback}</Text>
          )}

          <Pressable
            onPress={handlePost}
            disabled={!isValid}
            style={({ pressed }) => [
              styles.postBtn,
              !isValid && styles.postBtnDisabled,
              pressed && isValid && styles.postBtnPressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.postBtnText}>Post</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    marginBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  categoryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryPillActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: 'rgba(124, 58, 237, 0.6)',
  },
  categoryPillInactive: {
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: 'transparent',
  },
  categoryIcon: {
    fontSize: 11,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryLabelActive: {
    color: Colors.dark.primaryLight,
    fontWeight: '700',
  },
  categoryLabelInactive: {
    color: Colors.dark.textSecondary,
  },
  inputContainer: {
    backgroundColor: Colors.dark.surfaceSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  textInput: {
    minHeight: 52,
    maxHeight: 160,
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    textAlignVertical: 'top',
    padding: 0,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 8,
    borderRadius: 10,
    overflow: 'hidden',
    height: 100,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    backgroundColor: Colors.dark.surfaceSecondary,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 8,
  },
  emojiBtn: {
    padding: 6,
    borderRadius: 8,
  },
  emojiText: {
    fontSize: 16,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  mediaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  toolBtnPressed: {
    backgroundColor: Colors.dark.surfaceSecondary,
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  postBtn: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 12,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  postBtnDisabled: {
    opacity: 0.45,
  },
  postBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
})
