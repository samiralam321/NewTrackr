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
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { useQueryClient } from '@tanstack/react-query'
import { Colors } from '../../theme/colors'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function ComposeModal() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  const [content, setContent] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'Learned' | 'Built' | 'Practiced' | 'Other'>('Learned')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = ['Learned', 'Built', 'Practiced', 'Other'] as const

  const handlePost = async () => {
    if (!content.trim() || isSubmitting) return
    setIsSubmitting(true)

    try {
      await api.createPost(content.trim(), selectedCategory, [], imageUri || undefined)
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }
      router.back()
    } catch (err) {
      console.error('Failed to post progress:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Top Bar: Close on Left, Post button on Right */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={styles.topBarRight}>
          <Text style={styles.charCounter}>{content.length} / 500</Text>
          <Pressable
            onPress={handlePost}
            disabled={!content.trim() || isSubmitting}
            style={[styles.postBtn, !content.trim() && styles.postBtnDisabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.postBtnText}>Post</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Top Quick Toolbar (Category Pills + Media Actions) */}
      <View style={styles.toolbar}>
        <View style={styles.categoryRow}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.catPill, isSelected && styles.catPillActive]}
              >
                <Text style={[styles.catText, isSelected && styles.catTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <View style={styles.actionRow}>
          <Pressable onPress={handlePickImage} style={styles.toolIconBtn}>
            <Ionicons name="image-outline" size={20} color={Colors.dark.primary} />
          </Pressable>
          <Pressable style={styles.toolIconBtn}>
            <Ionicons name="happy-outline" size={20} color={Colors.dark.primary} />
          </Pressable>
        </View>
      </View>

      {/* Editor Content Canvas */}
      <View style={styles.canvas}>
        <Image
          source={{ uri: user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name || 'User'}&background=7C3AED&color=fff` }}
          style={styles.avatar}
        />
        <View style={styles.editorWrapper}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="What did you learn, build, or practice today?"
            placeholderTextColor={Colors.dark.textMuted}
            multiline
            autoFocus
            maxLength={500}
            style={styles.textInput}
          />

          {imageUri && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              <Pressable onPress={() => setImageUri(null)} style={styles.removeImgBtn}>
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  closeBtn: {
    padding: 6,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  charCounter: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  postBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.dark.primary,
  },
  postBtnDisabled: {
    opacity: 0.35,
  },
  postBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    backgroundColor: Colors.dark.surfaceSecondary,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 6,
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  catPillActive: {
    backgroundColor: Colors.dark.primary,
  },
  catText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  catTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  toolIconBtn: {
    padding: 6,
  },
  canvas: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  editorWrapper: {
    flex: 1,
  },
  textInput: {
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
    textAlignVertical: 'top',
    flex: 1,
  },
  previewContainer: {
    position: 'relative',
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    maxHeight: 200,
  },
  previewImage: {
    width: '100%',
    height: 200,
  },
  removeImgBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
