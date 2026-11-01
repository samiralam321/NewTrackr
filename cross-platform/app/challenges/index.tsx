import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../theme/colors'
import { api } from '../../services/api'
import { Question } from '../../types'

export default function ChallengesScreen() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(60)
  const [isCompleted, setIsCompleted] = useState(false)
  const [results, setResults] = useState<any>(null)

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['todayQuestions'],
    queryFn: () => api.getTodayQuestions(),
  })

  // 60-second quiz timer countdown
  useEffect(() => {
    if (isCompleted || questions.length === 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleFinish(selectedAnswers)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isCompleted, questions, selectedAnswers])

  const handleSelectOption = (option: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const nextAnswers = [...selectedAnswers, option]
    setSelectedAnswers(nextAnswers)

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1)
    } else {
      handleFinish(nextAnswers)
    }
  }

  const handleFinish = async (answers: string[]) => {
    setIsCompleted(true)
    const todayStr = new Date().toISOString().split('T')[0]
    try {
      const res = await api.submitChallenge(todayStr, 60 - timeLeft, answers)
      setResults(res)
    } catch (e) {
      console.error('Challenge submission error:', e)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    )
  }

  if (isCompleted && results) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.resultCard}>
          <Text style={styles.congratsText}>🎉 Challenge Completed!</Text>
          <Text style={styles.scoreNumber}>{results.score} / 100</Text>
          <Text style={styles.streakNotice}>🔥 Streak: {results.new_streak} Days</Text>
          <Text style={styles.rankNotice}>Rank: {results.new_rank}</Text>

          <Pressable onPress={() => router.back()} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>Back to Arena</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  const currentQ: Question | undefined = questions[currentIndex]
  if (!currentQ) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: '#fff' }}>No questions available for today.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Daily Arena Quiz</Text>
        <View style={styles.timerPill}>
          <Ionicons name="timer-outline" size={15} color={Colors.dark.streak} />
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          Question {currentIndex + 1} of {questions.length}
        </Text>
        <Text style={styles.topicBadge}>{currentQ.topic}</Text>
      </View>

      {/* Question Card */}
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{currentQ.question}</Text>
      </View>

      {/* Options List */}
      <View style={styles.optionsList}>
        {currentQ.options.map((opt, idx) => (
          <Pressable
            key={idx}
            onPress={() => handleSelectOption(opt)}
            style={styles.optionBtn}
          >
            <View style={styles.optionIndexCircle}>
              <Text style={styles.optionIndexText}>{String.fromCharCode(65 + idx)}</Text>
            </View>
            <Text style={styles.optionText}>{opt}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07060A',
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#07060A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dark.streakBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.dark.streak,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  topicBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  questionCard: {
    backgroundColor: Colors.dark.surface,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    color: '#FFFFFF',
  },
  optionsList: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  optionIndexCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIndexText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
  resultCard: {
    backgroundColor: Colors.dark.surface,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    width: '100%',
    maxWidth: 340,
  },
  congratsText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.dark.primary,
    marginBottom: 8,
  },
  streakNotice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.streak,
    marginBottom: 4,
  },
  rankNotice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: 24,
  },
  doneBtn: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
})
