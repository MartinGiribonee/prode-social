// Streak calculation logic

export function calculateStreak(lastActivityDate, currentStreak) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!lastActivityDate) {
    return { current_streak: 1, best_streak: Math.max(1, currentStreak || 0), last_activity_date: today };
  }

  const lastDate = new Date(lastActivityDate);
  lastDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day, no change
    return { current_streak: currentStreak, best_streak: currentStreak, last_activity_date: today };
  }

  if (diffDays === 1) {
    // Consecutive day
    const newStreak = (currentStreak || 0) + 1;
    return { current_streak: newStreak, best_streak: newStreak, last_activity_date: today };
  }

  // Streak broken
  return { current_streak: 1, best_streak: currentStreak || 1, last_activity_date: today };
}

export function getStreakEmoji(streak) {
  if (streak >= 30) return '⚡';
  if (streak >= 7) return '🏆';
  if (streak >= 3) return '🔥';
  return '✨';
}
