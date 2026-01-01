import { supabase } from "@/integrations/supabase/client";
import type {
  DifficultyLevel,
  GameOutcome,
  GameType,
  KnowledgeProgressPoint,
  KnowledgeSource,
  KnowledgeTrend,
  UserGameActivity,
  UserKnowledgeProgress,
} from "@/types";

/**
 * Clamp a numeric score into the 0–100 range.
 */
const clampScore = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
};

const DIFFICULTY_WEIGHTS: Record<DifficultyLevel, number> = {
  easy: 1,
  medium: 1.3,
  hard: 1.6,
};

/**
 * Convert quiz performance into a normalized per-game knowledge score (0–100).
 * - Base is the raw percentage of correct answers
 * - Higher difficulty increases the effective score via a weight
 */
export function calculateQuizActivityScore(
  percentageCorrect: number,
  difficulty: DifficultyLevel
): number {
  const base = clampScore(percentageCorrect);
  const weighted = base * (DIFFICULTY_WEIGHTS[difficulty] ?? 1);
  return clampScore(weighted);
}

/**
 * Convert a market challenge result into a normalized per-game knowledge score (0–100).
 * - Uses direction correctness + size of the move (as a proxy for risk)
 * - Bigger moves with correct calls score higher; wrong calls on big moves hurt more
 */
export function calculateChallengeActivityScore(params: {
  pnlPercent: number; // absolute day move for the chosen stock (e.g. 3.5 for +3.5%)
  correct: boolean;
}): number {
  const absMove = Math.min(50, Math.abs(params.pnlPercent || 0)); // cap extreme days
  const directionFactor = params.correct ? 1 : -1;
  const riskMultiplier = 1 + absMove / 50; // 1.0 – 2.0

  // Raw impact scaled into roughly [-40, +40]
  const impact = directionFactor * absMove * riskMultiplier * 0.8;
  const rawScore = 50 + impact; // center around 50

  return clampScore(rawScore);
}

/**
 * Core function to compute the next overall market knowledge score.
 *
 * Idea:
 * - Start from previous snapshot (or 50 if none)
 * - Compare game performance (0–100) vs current score
 * - Move gradually toward the game performance using a smoothing factor
 * - Quiz results and higher difficulty move the score a bit faster
 */
function calculateNextKnowledgeScore(options: {
  previousScore: number;
  gameScore: number; // 0–100 per game (already difficulty / risk adjusted)
  source: KnowledgeSource;
  difficulty?: DifficultyLevel;
}): number {
  const { previousScore, source, difficulty } = options;
  const gameScore = clampScore(options.gameScore);

  const baseSmoothing = source === "quiz" ? 0.18 : 0.14;
  const difficultyWeight = difficulty ? DIFFICULTY_WEIGHTS[difficulty] ?? 1 : 1;

  const smoothing = baseSmoothing * difficultyWeight;
  const delta = gameScore - previousScore;
  const next = previousScore + delta * smoothing;

  return clampScore(next);
}

async function resolveUserId(explicitUserId?: string): Promise<string | null> {
  if (explicitUserId) return explicitUserId;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user.id;
}

/**
 * Log a single game activity row to the user_game_activity table.
 *
 * This function is intentionally UI-agnostic so it can be reused
 * from quizzes, challenges, or any future game-like experiences.
 */
export async function logGameActivity(params: {
  userId?: string;
  gameType: GameType;
  gameId: string;
  difficultyLevel: DifficultyLevel;
  score: number; // normalized 0–100 for this game
  outcome: GameOutcome;
  metadata?: Record<string, unknown>;
}): Promise<UserGameActivity | null> {
  const userId = await resolveUserId(params.userId);
  if (!userId) return null;

  const payload = {
    user_id: userId,
    game_type: params.gameType,
    game_id: params.gameId,
    difficulty_level: params.difficultyLevel,
    score: clampScore(params.score),
    outcome: params.outcome,
    metadata: params.metadata ?? {},
  };

  // Cast supabase client to any so we can call newer tables
  // without waiting for regenerated DB types.
  const client: any = supabase;

  const { data, error } = await client
    .from("user_game_activity")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("logGameActivity error", error);
    return null;
  }

  return data as UserGameActivity;
}

/**
 * Insert a new snapshot into user_knowledge_progress after a game completes.
 *
 * A snapshot is an overall knowledge score (0–100) derived from:
 * - previous snapshot
 * - the specific game result (already normalized 0–100)
 * - the game type (quiz / challenge)
 * - game difficulty (if available)
 */
export async function updateKnowledgeProgress(params: {
  userId?: string;
  source: KnowledgeSource; // quiz | challenge | mixed
  gameScore: number; // 0–100 per game
  difficultyLevel?: DifficultyLevel;
}): Promise<UserKnowledgeProgress | null> {
  const userId = await resolveUserId(params.userId);
  if (!userId) return null;

  const client: any = supabase;

  // Fetch the latest snapshot to use as a baseline
  const { data: latest, error: latestError } = await client
    .from("user_knowledge_progress")
    .select("*")
    .eq("user_id", userId)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    console.error("updateKnowledgeProgress latest snapshot error", latestError);
  }

  const previousScore: number = latest?.knowledge_score ?? 50;

  const nextScore = calculateNextKnowledgeScore({
    previousScore,
    gameScore: params.gameScore,
    source: params.source,
    difficulty: params.difficultyLevel,
  });

  const snapshotPayload = {
    user_id: userId,
    knowledge_score: nextScore,
    calculated_from: params.source,
    snapshot_date: new Date().toISOString().slice(0, 10),
  };

  const { data, error } = await client
    .from("user_knowledge_progress")
    .insert(snapshotPayload)
    .select()
    .single();

  if (error) {
    console.error("updateKnowledgeProgress insert error", error);
    return null;
  }

  return data as UserKnowledgeProgress;
}

/**
 * Fetch ordered knowledge snapshots and join them with the
 * corresponding game activities (1:1, in completion order).
 *
 * This is what the frontend graph uses to plot progression over time
 * and show tooltips for which game affected each step.
 */
export async function fetchKnowledgeProgressSeries(
  userId?: string
): Promise<KnowledgeProgressPoint[]> {
  const resolvedUserId = await resolveUserId(userId);
  if (!resolvedUserId) return [];

  const client: any = supabase;

  const [
    { data: snapshots, error: snapErr },
    { data: activities, error: actErr },
  ] = await Promise.all([
    client
      .from("user_knowledge_progress")
      .select("*")
      .eq("user_id", resolvedUserId)
      .order("snapshot_date", { ascending: true }),
    client
      .from("user_game_activity")
      .select("*")
      .eq("user_id", resolvedUserId)
      .order("created_at", { ascending: true }),
  ]);

  if (snapErr) {
    console.error("fetchKnowledgeProgressSeries snapshots error", snapErr);
    return [];
  }
  if (actErr) {
    console.error("fetchKnowledgeProgressSeries activities error", actErr);
    return [];
  }

  const series: KnowledgeProgressPoint[] = [];
  const len = Math.min(snapshots?.length ?? 0, activities?.length ?? 0);

  for (let i = 0; i < len; i++) {
    const s = snapshots[i] as UserKnowledgeProgress;
    const a = activities[i] as UserGameActivity;

    series.push({
      ...s,
      gameType: a.game_type,
      gameId: a.game_id,
      activityScore: a.score,
      outcome: a.outcome,
      activityMetadata: a.metadata ?? null,
    });
  }

  return series;
}

/**
 * Determine whether the user is generally improving, declining,
 * or staying flat over their progression history.
 */
export function detectOverallTrend(
  history: UserKnowledgeProgress[]
): KnowledgeTrend {
  if (!history.length || history.length < 2) return "stagnant";

  const first = history[0];
  const last = history[history.length - 1];
  const delta = last.knowledge_score - first.knowledge_score;

  if (delta > 5) return "improving";
  if (delta < -5) return "declining";
  return "stagnant";
}

export interface FeatureContributionSummary {
  type: GameType;
  count: number;
  averageScore: number;
  contributionPercent: number;
}

/**
 * Compute how much each feature (quiz vs challenge) contributes
 * to the overall practice volume and quality.
 */
export async function getFeatureContribution(
  userId?: string
): Promise<FeatureContributionSummary[]> {
  const resolvedUserId = await resolveUserId(userId);
  if (!resolvedUserId) return [];

  const client: any = supabase;
  const { data, error } = await client
    .from("user_game_activity")
    .select("*")
    .eq("user_id", resolvedUserId);

  if (error || !data) {
    if (error) console.error("getFeatureContribution error", error);
    return [];
  }

  const buckets: Record<GameType, { count: number; scoreSum: number }> = {
    quiz: { count: 0, scoreSum: 0 },
    market_challenge: { count: 0, scoreSum: 0 },
  };

  (data as UserGameActivity[]).forEach((row) => {
    const bucket = buckets[row.game_type];
    if (!bucket) return;
    bucket.count += 1;
    bucket.scoreSum += row.score;
  });

  const totalScore =
    buckets.quiz.scoreSum + buckets.market_challenge.scoreSum || 1; // avoid div by zero

  const summaries: FeatureContributionSummary[] = (
    Object.keys(buckets) as GameType[]
  ).map((type) => {
    const { count, scoreSum } = buckets[type];
    const avg = count ? scoreSum / count : 0;
    const contributionPercent =
      totalScore > 0 ? (scoreSum / totalScore) * 100 : 0;

    return {
      type,
      count,
      averageScore: Number(avg.toFixed(1)),
      contributionPercent: Number(contributionPercent.toFixed(1)),
    };
  });

  return summaries;
}
