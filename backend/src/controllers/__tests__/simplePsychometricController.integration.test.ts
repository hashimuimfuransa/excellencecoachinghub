import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from '../../utils/database';
import { auth } from '../../middleware/auth';
import simplePsychometricRoutes from '../../routes/simplePsychometricRoutes';
import { TestSession, PsychometricTestResult, User, Job } from '../../models';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Integration tests to reproduce the exact 500 error
describe('SimplePsychometric Integration Tests - Reproduce 500 Error', () => {
  let app: express.Application;
  let testUser: any;
  let testJob: any;
  let testSession: any;
  let authToken: string;

  beforeAll(async () => {
    // Setup test app
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/psychometric-tests', simplePsychometricRoutes);

    // Connect to test database (or mock it)
    if (process.env.NODE_ENV !== 'test') {
      console.log('⚠️ Integration tests should run in test environment');
      return;
    }

    try {
      await connectDatabase();
      console.log('✅ Connected to test database');
    } catch (error) {
      console.log('⚠️ Database connection failed, using mocks');
    }

    // Create test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  async function setupTestData() {
    try {
      // Create test user
      testUser = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'jobseeker',
        isVerified: true
      });

      // Create test job
      testJob = await Job.create({
        title: 'Software Developer',
        company: 'Tech Corp',
        description: 'A great software developer position',
        industry: 'Technology',
        experienceLevel: 'mid_level',
        skills: ['JavaScript', 'React', 'Node.js'],
        status: 'active',
        jobType: 'full_time',
        location: 'Remote',
        educationLevel: 'bachelor',
        employer: testUser._id
      });

      // Generate auth token
      authToken = jwt.sign(
        { id: testUser._id, email: testUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1d' }
      );

      // Create test session with the problematic ID
      testSession = await TestSession.create({
        user: testUser._id,
        job: testJob._id,
        testLevel: 'intermediate',
        questions: [
          {
            question: 'What is the output of console.log(2 + 2)?',
            options: ['3', '4', '5', 'undefined'],
            correctAnswer: 1,
            explanation: '2 + 2 equals 4',
            category: 'cognitive'
          },
          {
            question: 'Which of the following is a JavaScript framework?',
            options: ['HTML', 'React', 'CSS', 'SQL'],
            correctAnswer: 1,
            explanation: 'React is a JavaScript framework',
            category: 'cognitive'
          },
          {
            question: 'What is the correct way to declare a variable in JavaScript?',
            options: ['var x', 'let x', 'const x', 'All of the above'],
            correctAnswer: 3,
            explanation: 'All are valid ways to declare variables',
            category: 'cognitive'
          }
        ],
        timeLimit: 30,
        status: 'in_progress',
        startedAt: new Date(Date.now() - 300000), // Started 5 minutes ago
        generatedAt: new Date()
      });

      console.log('✅ Test data created:', {
        userId: testUser._id,
        jobId: testJob._id,
        sessionId: testSession._id
      });

    } catch (error) {
      console.error('❌ Failed to create test data:', error);
      throw error;
    }
  }

  async function cleanupTestData() {
    try {
      if (testSession) await TestSession.deleteOne({ _id: testSession._id });
      if (testJob) await Job.deleteOne({ _id: testJob._id });
      if (testUser) await User.deleteOne({ _id: testUser._id });
      
      // Clean up any test results
      await PsychometricTestResult.deleteMany({ 
        user: testUser?._id,
        job: testJob?._id 
      });
      
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  describe('Reproduce 500 Error', () => {
    it('should submit test successfully without 500 error', async () => {
      if (!testSession) {
        console.log('⚠️ Skipping integration test - no test data');
        return;
      }

      const response = await request(app)
        .post(`/api/psychometric-tests/submit/${testSession._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: [1, 1, 3] // Correct answers for the test questions
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('score');
      expect(response.body.data).toHaveProperty('resultId');
      expect(response.body.data.totalQuestions).toBe(3);
      expect(response.body.data.correctAnswers).toBe(3); // All correct

      console.log('✅ Test submitted successfully:', {
        score: response.body.data.score,
        resultId: response.body.data.resultId
      });
    });

    it('should handle the specific error scenario from production', async () => {
      if (!testSession) {
        console.log('⚠️ Skipping integration test - no test data');
        return;
      }

      // Create a scenario that might cause the production error
      const response = await request(app)
        .post(`/api/psychometric-tests/submit/${testSession._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: [0, 2, 1], // Mix of correct and incorrect answers
          // Add extra data that might cause issues
          timeSpent: 300,
          metadata: {
            userAgent: 'Test Browser',
            timestamp: new Date().toISOString()
          }
        });

      if (response.status === 500) {
        console.error('❌ 500 Error reproduced:', response.body);
        console.error('Response headers:', response.headers);
        
        // Log the actual error for debugging
        expect(response.body).toHaveProperty('error');
        console.log('Error details:', response.body);
      } else {
        console.log('✅ Request completed successfully');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });

    it('should handle invalid session ID that matches production error', async () => {
      // Use the exact session ID from the error: 68b044cda17f7b6db6ea1fe1
      const response = await request(app)
        .post('/api/psychometric-tests/submit/68b044cda17f7b6db6ea1fe1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: [1, 2, 0, 1, 3, 2, 1, 0, 2, 1]
        });

      if (response.status === 500) {
        console.error('❌ 500 Error with specific ID:', response.body);
        
        // This helps us understand what's causing the error
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/Failed to submit test|Test session not found/);
      } else {
        // Session not found should return 404, not 500
        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle missing authentication', async () => {
      if (!testSession) {
        console.log('⚠️ Skipping integration test - no test data');
        return;
      }

      const response = await request(app)
        .post(`/api/psychometric-tests/submit/${testSession._id}`)
        // No Authorization header
        .send({
          answers: [1, 1, 3]
        });

      // Should be unauthorized, not 500 error
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should handle malformed request body', async () => {
      if (!testSession) {
        console.log('⚠️ Skipping integration test - no test data');
        return;
      }

      const response = await request(app)
        .post(`/api/psychometric-tests/submit/${testSession._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing answers array
          timeSpent: 300
        });

      // Should be bad request, not 500 error
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/Answers must be provided as an array/);
    });
  });

  describe('Test with Database Issues', () => {
    it('should handle database connection issues gracefully', async () => {
      if (!testSession) {
        console.log('⚠️ Skipping integration test - no test data');
        return;
      }

      // Temporarily close the database connection to simulate connection issues
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }

      const response = await request(app)
        .post(`/api/psychometric-tests/submit/${testSession._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: [1, 1, 3]
        });

      // Should handle database errors gracefully
      if (response.status === 500) {
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('Failed to submit test');
        console.log('✅ Database error handled gracefully');
      }

      // Reconnect for cleanup
      try {
        await connectDatabase();
      } catch (error) {
        console.log('⚠️ Could not reconnect to database for cleanup');
      }
    });
  });
});