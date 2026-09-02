export function getBadgeLevel(consistencyScore: number | null | undefined): number {
  const score = consistencyScore || 0
  if (score >= 100) return 3
  if (score >= 30) return 2
  if (score >= 5) return 1
  return 0
}

export async function updateUserStreakAndBadge(supabase: any, userId: string) {
  // Fetch user profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('consistency_score, last_post_date')
    .eq('id', userId)
    .single()

  if (error || !profile) return { error }

  // 1. Standardize on UTC date string calculation (LeetCode DCC 24-hour UTC window)
  const todayStr = new Date().toISOString().split('T')[0]

  let newStreak = profile.consistency_score || 0
  const lastPostDateStr = profile.last_post_date

  if (!lastPostDateStr) {
    newStreak = 1
  } else {
    const [currY, currM, currD] = todayStr.split('-').map(Number)
    const [lastY, lastM, lastD] = String(lastPostDateStr).split('-').map(Number)
    const current = Date.UTC(currY, currM - 1, currD)
    const last = Date.UTC(lastY, lastM - 1, lastD)
    const diffDays = Math.round((current - last) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      newStreak += 1
    } else if (diffDays > 1) {
      newStreak = 1 // Reset streak if they missed a day
    }
    // If diffDays <= 0, they already posted today on this UTC date, maintain streak
  }

  // Calculate badge level based on new streak
  const newBadgeLevel = getBadgeLevel(newStreak)
  const oldBadgeLevel = getBadgeLevel(profile.consistency_score)
  const isNewBadgeEarned = newBadgeLevel > oldBadgeLevel

  // Update profile (badge_level is calculated dynamically, so we only save consistency_score & last_post_date)
  const updateData: any = {
    consistency_score: newStreak,
    last_post_date: todayStr
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)

  if (updateError) return { error: updateError }

  // Create notification if a new badge was earned (use post_id: null to avoid FK constraint errors)
  if (isNewBadgeEarned) {
    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        actor_id: userId,
        type: 'badge',
        post_id: null,
        is_read: false
      })
    } catch (notifErr) {
      console.warn("Could not insert badge notification:", notifErr)
    }
  }

  return {
    streak: newStreak,
    badgeLevel: newBadgeLevel,
    isNewBadgeEarned,
    oldBadgeLevel
  }
}
