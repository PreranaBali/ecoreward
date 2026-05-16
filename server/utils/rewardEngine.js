/**
 * Reward Engine – EcoReward
 * Calculates points based on verification results, streaks, and waste type.
 */

const POINTS = {
  base:             100,
  garbageBonus:      30,   // AI confirmed garbage
  locationBonus:     20,
  timestampBonus:    10,
  wasteType: {
    hazardous:    50,
    recyclable:   20,
    organic:      15,
    mixed:         0,
  },
  streakMultiplier: (streak) => {
    if (streak >= 30) return 2.0;
    if (streak >= 14) return 1.5;
    if (streak >= 7)  return 1.25;
    if (streak >= 3)  return 1.1;
    return 1.0;
  },
};

/**
 * calculate
 * @param {import('../models/User')} user
 * @param {object} verification
 * @returns {{ base: number, bonus: number, total: number }}
 */
exports.calculate = (user, verification) => {
  let base = POINTS.base;
  if (verification.garbageDetected)  base += POINTS.garbageBonus;
  if (verification.locationVerified) base += POINTS.locationBonus;
  if (verification.timestampValid)   base += POINTS.timestampBonus;

  const wasteBonus = POINTS.wasteType[verification.wasteType] ?? 0;
  base += wasteBonus;

  // Streak multiplier
  const multiplier = POINTS.streakMultiplier(user?.streak || 0);
  const withStreak = Math.round(base * multiplier);
  const bonus      = withStreak - base;

  return { base, bonus, total: withStreak };
};

/**
 * ACHIEVEMENT DEFINITIONS
 * Checked on each report submission; awarded once per user.
 */
const ACHIEVEMENTS = [
  {
    id:          'first_report',
    name:        'First Step',
    description: 'Submitted your first garbage report',
    icon:        '🌱',
    check:       (_user, totalReports) => totalReports === 1,
  },
  {
    id:          'streak_7',
    name:        'On Fire',
    description: 'Maintained a 7-day upload streak',
    icon:        '🔥',
    check:       (user) => user.streak >= 7,
  },
  {
    id:          'streak_30',
    name:        'Iron Will',
    description: '30-day upload streak',
    icon:        '⚡',
    check:       (user) => user.streak >= 30,
  },
  {
    id:          'points_1000',
    name:        'Eco Starter',
    description: 'Earned 1,000 reward points',
    icon:        '🌿',
    check:       (user) => user.points >= 1000,
  },
  {
    id:          'reports_50',
    name:        'City Guardian',
    description: 'Submitted 50 verified reports',
    icon:        '🏙️',
    check:       (_user, totalReports) => totalReports >= 50,
  },
  {
    id:          'hazardous',
    name:        'Hazmat Hero',
    description: 'Reported a hazardous waste item',
    icon:        '☢️',
    check:       (_user, _total, lastReport) => lastReport?.verification?.wasteType === 'hazardous',
  },
];

/**
 * checkAchievements
 * Returns array of newly earned achievement IDs.
 */
exports.checkAchievements = (user, totalReports, lastReport) => {
  const earned    = new Set(user.achievements.map((a) => a.id));
  const newEarned = [];

  for (const ach of ACHIEVEMENTS) {
    if (earned.has(ach.id)) continue;
    if (ach.check(user, totalReports, lastReport)) {
      newEarned.push({ id: ach.id, name: ach.name, description: ach.description, icon: ach.icon });
    }
  }
  return newEarned;
};
