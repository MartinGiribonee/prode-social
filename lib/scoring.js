// Scoring logic for predictions
// Exact result: 3 points | Correct winner: 1 point | Wrong: 0 points

export function calculatePoints(prediction, actual) {
  if (actual.home_score === null || actual.away_score === null) return 0;
  
  const predHome = prediction.home_prediction;
  const predAway = prediction.away_prediction;
  const actHome = actual.home_score;
  const actAway = actual.away_score;

  // Exact match
  if (predHome === actHome && predAway === actAway) return 3;

  // Correct winner/draw
  const predResult = Math.sign(predHome - predAway);
  const actResult = Math.sign(actHome - actAway);
  if (predResult === actResult) return 1;

  return 0;
}

export function getResultLabel(points) {
  if (points === 3) return { label: '🎯 Exacto', color: 'var(--gold)' };
  if (points === 1) return { label: '✓ Parcial', color: 'var(--accent)' };
  return { label: '✗ Error', color: 'var(--danger)' };
}
