import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This should ideally be protected by a secure admin key or middleware
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    if (secret !== (process.env.ADMIN_SECRET_KEY || 'trackr-admin-secret')) {
      return NextResponse.json({ error: 'Unauthorized. Use ?secret=trackr-admin-secret' }, { status: 401 })
    }

    // Use Service Role Key to bypass RLS for administrative task
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Fetch all available questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, topic, difficulty')

    if (questionsError || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Failed to fetch questions or pool is empty' }, { status: 500 })
    }

    // 2. Determine generation dates (next 30 days)
    const today = new Date()
    const targetDates = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      return d.toISOString().split('T')[0] // YYYY-MM-DD
    })

    // 3. Fetch recently used questions to avoid repetition (last 7 days)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: recentChallenges } = await supabase
      .from('daily_challenges')
      .select('question_ids')
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])

    const usedIds = new Set<string>()
    if (recentChallenges) {
      recentChallenges.forEach(c => c.question_ids.forEach((id: string) => usedIds.add(id)))
    }

    const generatedChallenges = []

    for (const date of targetDates) {
      // Check if this date already has a challenge
      const { data: existing } = await supabase.from('daily_challenges').select('date').eq('date', date).single()
      if (existing) continue // Skip if already generated

      // Filter available questions pool
      let availableQuestions = questions.filter(q => !usedIds.has(q.id))
      
      // Fallback: If pool is too small, allow reused questions
      if (availableQuestions.length < 5) {
        availableQuestions = questions
      }

      // We need 2 Medium, 3 Hard
      const mediumPool = availableQuestions.filter(q => q.difficulty === 'Medium')
      const hardPool = availableQuestions.filter(q => q.difficulty === 'Hard')

      if (mediumPool.length < 2 || hardPool.length < 3) {
         // Second fallback: Just grab any 5 questions if difficulty limits aren't met
         if (availableQuestions.length >= 5) {
             const any5 = availableQuestions.sort(() => 0.5 - Math.random()).slice(0, 5)
             const ids = any5.map(q => q.id)
             generatedChallenges.push({ date, question_ids: ids })
             ids.forEach(id => usedIds.add(id))
         }
         continue
      }

      // Try to ensure topic diversity
      // Simple strategy: shuffle, pick unique topics first
      const selectedMedium = selectDiverseQuestions(mediumPool, 2)
      const selectedHard = selectDiverseQuestions(hardPool, 3)

      const finalSelection = [...selectedMedium, ...selectedHard].map(q => q.id)

      generatedChallenges.push({
        date,
        question_ids: finalSelection
      })

      finalSelection.forEach(id => usedIds.add(id))
    }

    if (generatedChallenges.length > 0) {
      const { error: insertError } = await supabase
        .from('daily_challenges')
        .insert(generatedChallenges)

      if (insertError) {
        return NextResponse.json({ error: 'Failed to insert challenges', details: insertError }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully generated challenges for ${generatedChallenges.length} days.`,
      dates: generatedChallenges.map(g => g.date)
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Helper to pick n questions favoring diverse topics
function selectDiverseQuestions(pool: any[], count: number) {
  const shuffled = pool.sort(() => 0.5 - Math.random())
  const selected = []
  const usedTopics = new Set<string>()

  // Try to pick unique topics
  for (const q of shuffled) {
    if (!usedTopics.has(q.topic) && selected.length < count) {
      selected.push(q)
      usedTopics.add(q.topic)
    }
  }

  // If we still need more (couldn't find unique topics), just fill it
  if (selected.length < count) {
    for (const q of shuffled) {
      if (!selected.includes(q) && selected.length < count) {
        selected.push(q)
      }
    }
  }

  return selected
}
