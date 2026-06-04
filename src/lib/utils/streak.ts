export async function updateUserStreakAndBadge(supabase: any, userId: string) {
  // Fetch user profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('consistency_score, last_post_date, badge_level')
    .eq('id', userId)
    .single()

  if (error || !profile) return { error }

  // 1. Get today's local date in YYYY-MM-DD
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const todayStr = `${yyyy}-${mm}-${dd}`

  let newStreak = profile.consistency_score || 0
  const lastPostDateStr = profile.last_post_date

  if (!lastPostDateStr) {
    newStreak = 1
  } else if (lastPostDateStr !== todayStr) {
    // Check if it was yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const y_yyyy = yesterday.getFullYear()
    const y_mm = String(yesterday.getMonth() + 1).padStart(2, '0')
    const y_dd = String(yesterday.getDate()).padStart(2, '0')
    const yesterdayStr = `${y_yyyy}-${y_mm}-${y_dd}`

    if (lastPostDateStr === yesterdayStr) {
      newStreak += 1
    } else {
      newStreak = 1 // Reset streak if they missed a day
    }
  }

  // Calculate badge level based on new streak
  let newBadgeLevel = 0
  if (newStreak >= 100) {
    newBadgeLevel = 3
  } else if (newStreak >= 30) {
    newBadgeLevel = 2
  } else if (newStreak >= 5) {
    newBadgeLevel = 1
  }

  const oldBadgeLevel = profile.badge_level || 0
  const isNewBadgeEarned = newBadgeLevel > oldBadgeLevel

  // Update profile
  const updateData: any = {
    consistency_score: newStreak,
    last_post_date: todayStr
  }

  if (isNewBadgeEarned) {
    updateData.badge_level = newBadgeLevel
    updateData.badge_earned_at = new Date().toISOString()
  } else if (newBadgeLevel < oldBadgeLevel) {
    // If streak drops, badge level is updated to match new streak
    updateData.badge_level = newBadgeLevel
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)

  if (updateError) return { error: updateError }

  // Create notification if a new badge was earned
  if (isNewBadgeEarned) {
    const dummyPostIdMap = {
      1: '00000000-0000-0000-0000-000000000001',
      2: '00000000-0000-0000-0000-000000000002',
      3: '00000000-0000-0000-0000-000000000003'
    }
    const dummyPostId = dummyPostIdMap[newBadgeLevel as 1 | 2 | 3]

    // Insert badge notification
    await supabase.from('notifications').insert({
      user_id: userId,
      actor_id: userId,
      type: 'badge',
      post_id: dummyPostId,
      is_read: false
    })
  }

  return {
    streak: newStreak,
    badgeLevel: newBadgeLevel,
    isNewBadgeEarned,
    oldBadgeLevel
  }
}
