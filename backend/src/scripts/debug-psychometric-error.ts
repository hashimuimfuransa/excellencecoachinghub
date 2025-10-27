import { connectDatabase } from '../utils/database';
import { TestSession, PsychometricTestResult } from '../models';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Debug script to identify the exact cause of the psychometric test submission 500 error
 * Run this script to check database state and identify potential issues
 */

async function debugPsychometricError() {
  try {
    console.log('🔍 Starting debug analysis for psychometric test submission error...\n');

    // Connect to database
    console.log('📡 Connecting to database...');
    await connectDatabase();
    console.log('✅ Database connected successfully\n');

    // Check the specific session ID from the error
    const problematicSessionId = '68b044cda17f7b6db6ea1fe1';
    console.log(`🔍 Checking session ID: ${problematicSessionId}`);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(problematicSessionId)) {
      console.log('❌ Invalid ObjectId format - this could cause a 500 error');
      return;
    } else {
      console.log('✅ ObjectId format is valid');
    }

    // Try to find the session
    console.log('🔍 Searching for test session...');
    const testSession = await TestSession.findById(problematicSessionId)
      .populate('job')
      .populate('user', 'firstName lastName email');

    if (!testSession) {
      console.log('❌ Test session not found in database');
      console.log('   This should return 404, but might be causing 500 error\n');
      
      // Check how many sessions exist
      const sessionCount = await TestSession.countDocuments();
      console.log(`📊 Total sessions in database: ${sessionCount}`);
      
      // Show recent sessions
      const recentSessions = await TestSession.find()
        .limit(5)
        .sort({ createdAt: -1 })
        .select('_id user job status createdAt');
        
      console.log('📋 Recent sessions:');
      recentSessions.forEach((session, index) => {
        console.log(`   ${index + 1}. ID: ${session._id}, Status: ${session.status}, Created: ${session.createdAt}`);
      });
      console.log();
    } else {
      console.log('✅ Test session found:');
      console.log(`   Status: ${testSession.status}`);
      console.log(`   User: ${testSession.user ? (testSession.user as any).email : 'null'}`);
      console.log(`   Job: ${testSession.job ? (testSession.job as any).title : 'null'}`);
      console.log(`   Questions: ${testSession.questions?.length || 0}`);
      console.log(`   Time limit: ${testSession.timeLimit} minutes`);
      
      // Check if job data is properly populated
      if (!testSession.job) {
        console.log('⚠️  Job data is null - this could cause errors in generateInterpretation()');
      }
      
      // Check questions structure
      if (!testSession.questions || testSession.questions.length === 0) {
        console.log('⚠️  No questions found - this could cause calculation errors');
      } else {
        console.log('✅ Questions structure looks valid');
        
        // Validate question structure
        const firstQuestion = testSession.questions[0] as any;
        console.log('🔍 First question structure:');
        console.log(`   Question: ${firstQuestion.question ? '✅' : '❌'}`);
        console.log(`   Options: ${Array.isArray(firstQuestion.options) ? '✅' : '❌'}`);
        console.log(`   Correct Answer: ${typeof firstQuestion.correctAnswer === 'number' ? '✅' : '❌'}`);
        console.log(`   Category: ${firstQuestion.category ? '✅' : '❌'}`);
        console.log(`   Explanation: ${firstQuestion.explanation ? '✅' : '❌'}`);
      }
      
      console.log();
    }

    // Check for existing test results for this session
    console.log('🔍 Checking for existing test results...');
    const existingResult = await PsychometricTestResult.findOne({
      'testMetadata.testId': problematicSessionId
    });

    if (existingResult) {
      console.log('📋 Existing test result found:');
      console.log(`   Result ID: ${existingResult._id}`);
      console.log(`   Score: ${existingResult.overallScore}%`);
      console.log(`   User: ${existingResult.user}`);
    } else {
      console.log('📋 No existing test result found');
    }

    // Test the helper functions that might cause issues
    console.log('\n🧪 Testing helper functions...');
    
    // Test calculateCategoryScores
    const sampleResults = [
      { isCorrect: true, category: 'cognitive' },
      { isCorrect: false, category: 'cognitive' },
      { isCorrect: true, category: 'numerical' }
    ];
    
    try {
      const categoryScores = calculateCategoryScores(sampleResults);
      console.log('✅ calculateCategoryScores works correctly:', categoryScores);
    } catch (error) {
      console.log('❌ calculateCategoryScores failed:', (error as Error).message);
    }

    // Test generateInterpretation
    try {
      const interpretation = generateInterpretation(75, { cognitive: 50, numerical: 100 }, 'Software Developer');
      console.log('✅ generateInterpretation works correctly');
      console.log(`   Length: ${interpretation.length} characters`);
    } catch (error) {
      console.log('❌ generateInterpretation failed:', (error as Error).message);
    }

    // Test generateRecommendations
    try {
      const recommendations = generateRecommendations(75, 'Software Developer');
      console.log('✅ generateRecommendations works correctly');
      console.log(`   Count: ${recommendations.length} recommendations`);
    } catch (error) {
      console.log('❌ generateRecommendations failed:', (error as Error).message);
    }

    // Test JSON serialization with potentially problematic data
    console.log('\n🧪 Testing JSON serialization...');
    
    const testData = {
      success: true,
      data: {
        resultId: 'test123',
        score: 75,
        totalQuestions: 10,
        correctAnswers: 7,
        incorrectAnswers: 3,
        timeSpent: 300,
        interpretation: 'Test interpretation with special characters: àáâãäåæçèéêë',
        categoryScores: { cognitive: 75, numerical: 80 },
        hasDetailedResults: true,
        recommendations: ['Test recommendation 1', 'Test recommendation 2'],
        grade: 'Good',
        percentile: 64,
        summary: {
          correctCount: 7,
          incorrectCount: 3,
          categories: ['cognitive', 'numerical']
        }
      },
      message: 'Test completed successfully!'
    };

    try {
      const jsonString = JSON.stringify(testData);
      console.log('✅ JSON serialization works correctly');
      console.log(`   JSON size: ${jsonString.length} bytes`);
    } catch (error) {
      console.log('❌ JSON serialization failed:', (error as Error).message);
    }

    // Check database indexes and performance
    console.log('\n🔍 Checking database indexes...');
    const indexes = await TestSession.collection.getIndexes();
    console.log(`📊 TestSession indexes: ${Object.keys(indexes).length}`);
    
    const resultIndexes = await PsychometricTestResult.collection.getIndexes();
    console.log(`📊 PsychometricTestResult indexes: ${Object.keys(resultIndexes).length}`);

    console.log('\n✅ Debug analysis complete!');

  } catch (error) {
    console.error('❌ Debug analysis failed:', error);
    console.error('Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Helper functions from the controller (copied for testing)
function calculateCategoryScores(detailedResults: any[]) {
  const categories: { [key: string]: { correct: number; total: number } } = {};

  detailedResults.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = { correct: 0, total: 0 };
    }
    categories[result.category]!.total++;
    if (result.isCorrect) {
      categories[result.category]!.correct++;
    }
  });

  const categoryScores: { [key: string]: number } = {};
  Object.keys(categories).forEach(category => {
    categoryScores[category] = Math.round(
      (categories[category]!.correct / categories[category]!.total) * 100
    );
  });

  return categoryScores;
}

function generateInterpretation(score: number, categoryScores: { [key: string]: number }, jobTitle: string): string {
  let interpretation = `Based on your psychometric assessment for the ${jobTitle} position, you scored ${score}% overall. `;

  if (score >= 90) {
    interpretation += "This is an exceptional performance that demonstrates outstanding aptitude for this role. ";
  } else if (score >= 80) {
    interpretation += "This is an excellent performance that shows strong suitability for this position. ";
  } else if (score >= 70) {
    interpretation += "This is a good performance that indicates solid potential for this role. ";
  } else if (score >= 60) {
    interpretation += "This is an average performance with room for improvement in key areas. ";
  } else {
    interpretation += "This performance suggests significant development is needed for this role. ";
  }

  // Add category-specific feedback
  const categories = Object.keys(categoryScores);
  if (categories.length > 0) {
    interpretation += "Your performance across different categories shows: ";
    const strengths = categories.filter(cat => categoryScores[cat]! >= 75);
    const improvements = categories.filter(cat => categoryScores[cat]! < 60);

    if (strengths.length > 0) {
      interpretation += `strong performance in ${strengths.join(', ')} (${strengths.map(cat => categoryScores[cat] + '%').join(', ')}). `;
    }
    
    if (improvements.length > 0) {
      interpretation += `Areas for development include ${improvements.join(', ')} (${improvements.map(cat => categoryScores[cat] + '%').join(', ')}). `;
    }
  }

  interpretation += `This assessment provides insights into your readiness for the ${jobTitle} position and highlights areas for professional development.`;
  
  return interpretation;
}

function generateRecommendations(score: number, jobTitle: string): string[] {
  const recommendations: string[] = [];

  if (score >= 80) {
    recommendations.push(`Excellent performance! You show strong aptitude for the ${jobTitle} position.`);
    recommendations.push('Consider applying for senior-level positions in your field.');
  } else if (score >= 60) {
    recommendations.push(`Good performance on the ${jobTitle} assessment.`);
    recommendations.push('Focus on developing specific skills mentioned in the job requirements.');
    recommendations.push('Consider taking additional courses to strengthen your knowledge base.');
  } else {
    recommendations.push(`Your performance indicates room for improvement for the ${jobTitle} position.`);
    recommendations.push('Consider gaining more experience or education in the required areas.');
    recommendations.push('Practice similar assessments to improve your test-taking skills.');
    recommendations.push('Review the job requirements and focus on developing those specific skills.');
  }

  return recommendations;
}

// Run the debug script
debugPsychometricError();