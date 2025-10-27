import { Achievement } from '../models/Achievement';

export const seedAchievements = async () => {
  try {
    // Check if achievements already exist
    const existingCount = await Achievement.countDocuments();
    if (existingCount > 0) {
      console.log('Achievements already seeded, skipping...');
      return;
    }

    const achievements = [
      {
        title: 'First Steps',
        description: 'Complete your first lesson',
        icon: '🎯',
        category: 'milestone',
        points: 10,
        requirements: [
          {
            type: 'lessons_completed',
            target: 1,
            current: 0,
            description: 'Complete 1 lesson'
          }
        ],
        rarity: 'common'
      },
      {
        title: 'Quiz Master',
        description: 'Score 80% or higher on 5 quizzes',
        icon: '🏆',
        category: 'learning',
        points: 50,
        requirements: [
          {
            type: 'quiz_score',
            target: 5,
            current: 0,
            description: 'Score 80%+ on 5 quizzes'
          }
        ],
        rarity: 'rare'
      },
      {
        title: 'Dedicated Learner',
        description: 'Maintain a 7-day learning streak',
        icon: '🔥',
        category: 'engagement',
        points: 100,
        requirements: [
          {
            type: 'streak',
            target: 7,
            current: 0,
            description: 'Maintain 7-day streak'
          }
        ],
        rarity: 'epic'
      },
      {
        title: 'Knowledge Seeker',
        description: 'Complete 25 lessons',
        icon: '📚',
        category: 'learning',
        points: 75,
        requirements: [
          {
            type: 'lessons_completed',
            target: 25,
            current: 0,
            description: 'Complete 25 lessons'
          }
        ],
        rarity: 'rare'
      },
      {
        title: 'Time Master',
        description: 'Spend 20 hours learning',
        icon: '⏰',
        category: 'engagement',
        points: 150,
        requirements: [
          {
            type: 'time_spent',
            target: 1200, // 20 hours in minutes
            current: 0,
            description: 'Spend 20 hours learning'
          }
        ],
        rarity: 'epic'
      },
      {
        title: 'Perfectionist',
        description: 'Achieve 95% average score',
        icon: '💎',
        category: 'learning',
        points: 200,
        requirements: [
          {
            type: 'quiz_score',
            target: 95,
            current: 0,
            description: 'Achieve 95% average score'
          }
        ],
        rarity: 'legendary'
      },
      {
        title: 'Social Butterfly',
        description: 'Connect with 10 fellow learners',
        icon: '🦋',
        category: 'engagement',
        points: 30,
        requirements: [
          {
            type: 'points_earned',
            target: 10,
            current: 0,
            description: 'Connect with 10 fellow learners'
          }
        ],
        rarity: 'common'
      },
      {
        title: 'Group Leader',
        description: 'Create and moderate a study group',
        icon: '👑',
        category: 'special',
        points: 80,
        requirements: [
          {
            type: 'points_earned',
            target: 1,
            current: 0,
            description: 'Create and moderate a study group'
          }
        ],
        rarity: 'rare'
      }
    ];

    await Achievement.insertMany(achievements);
    console.log(`✅ Seeded ${achievements.length} achievements`);
  } catch (error) {
    console.error('Error seeding achievements:', error);
  }
};