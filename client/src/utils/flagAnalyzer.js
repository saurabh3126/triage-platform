const SENSATIONAL_KEYWORDS = [
  { word: 'breaking', score: 30 },
  { word: 'shocking', score: 25 },
  { word: 'share before deleted', score: 35 },
  { word: 'share before it gets deleted', score: 35 },
  { word: 'urgent', score: 20 },
  { word: 'must see', score: 20 },
  { word: "they don't want you to know", score: 30 },
  { word: 'deleted soon', score: 30 },
  { word: 'share now', score: 15 },
  { word: 'wake up', score: 20 },
  { word: 'exposed', score: 20 },
  { word: 'they are hiding', score: 25 },
  { word: 'going viral', score: 15 },
  { word: "before it's too late", score: 25 },
];

export function analyzeFlagsClient(text = '') {
  if (!text.trim()) {
    return {
      sensational: false,
      shouting: false,
      unsourced: false,
      isHighRisk: false,
      riskScore: 0,
      riskLevel: 'Low',
    };
  }

  let score = 0;
  const lower = text.toLowerCase();
  const letters = text.replace(/[^a-zA-Z]/g, '');
  const capsCount = (text.match(/[A-Z]/g) || []).length;
  const exclamationCount = (text.match(/!/g) || []).length;

  // Flag 1: Sensational keywords
  let sensationalScore = 0;
  let sensational = false;
  for (const kw of SENSATIONAL_KEYWORDS) {
    if (lower.includes(kw.word)) {
      sensational = true;
      sensationalScore = Math.max(sensationalScore, kw.score);
    }
  }
  score += sensationalScore;

  // Flag 2: Shouting (>50% caps)
  const shouting = letters.length > 10 && capsCount / letters.length > 0.5;
  if (shouting) score += 25;

  // Flag 3: Unsourced (no URL)
  const unsourced = !/https?:\/\//i.test(text);
  if (unsourced) score += 20;

  // Exclamation marks
  if (exclamationCount >= 3) score += 10;

  // Short post penalty
  if (text.trim().length > 0 && text.trim().length < 50) score += 5;

  score = Math.min(score, 100);

  const flagCount = [sensational, shouting, unsourced].filter(Boolean).length;
  const isHighRisk = flagCount >= 2;

  let riskLevel;
  if (score <= 20) riskLevel = 'Low';
  else if (score <= 50) riskLevel = 'Medium';
  else if (score <= 75) riskLevel = 'High';
  else riskLevel = 'Critical';

  return {
    sensational,
    shouting,
    unsourced,
    isHighRisk,
    riskScore: score,
    riskLevel,
  };
}