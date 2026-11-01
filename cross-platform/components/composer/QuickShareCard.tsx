import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../theme/colors'
import { api } from '../../services/api'

export function QuickShareCard({ onPostCreated }: { onPostCreated?: () => void }) {
  const [content, setContent] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'Learned' | 'Built' | 'Practiced' | 'Other'>('Learned')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = ['Learned', 'Built', 'Practiced', 'Other'] as const

  const handlePost = async () => {
    if (!content.trim() || isSubmitting) return
    setIsSubmitting(true)

    try {
      await api.createPost(content.trim(), selectedCategory)
      setContent('')
      if (onPostCreated) onPostCreated()
    } catch (err) {
      console.error('Failed to create post:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QUICK SHARE</Text>

      {/* Category Pills */}
      <View style={styles.categoryRow}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat
          return (
            <Pressable
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[styles.categoryBtn, isSelected && styles.categoryBtnActive]}
            >
              <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                {cat}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {/* Input */}
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="What did you build or learn today?"
        placeholderTextColor={Colors.dark.textMuted}
        multiline
        style={styles.input}
      />

      {/* Action Footer */}
      <View style={styles.footer}>
        <View style={styles.iconActions}>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="image-outline" size={18} color={Colors.dark.textSecondary} />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="happy-outline" size={18} color={Colors.dark.textSecondary} />
          </Pressable>
        </View>

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
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 16,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  categoryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.dark.surfaceSecondary,
  },
  categoryBtnActive: {
    backgroundColor: Colors.dark.primary,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  input: {
    minHeight: 70,
    maxHeight: 140,
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 20,
    textAlignVertical: 'top',
    padding: 10,
    backgroundColor: Colors.dark.surfaceSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
  },
  postBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtnDisabled: {
    opacity: 0.4,
  },
  postBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
})
