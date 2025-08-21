import { test, expect } from '@playwright/test';

test.describe('Psychometric Test Payment and Session Management', () => {
  let page;
  let testId: string;
  let sessionId: string;
  
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Mock authentication - in a real scenario, you'd login first
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'professional'
      }));
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should allow user to purchase a test', async () => {
    // Mock API responses for test purchase
    await page.route('**/api/psychometric-tests/*/purchase', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            _id: 'purchase-id-123',
            user: 'test-user-id',
            test: 'test-id-123',
            paymentIntentId: 'pi_test_123',
            amount: 2999,
            currency: 'USD',
            status: 'completed',
            maxAttempts: 3,
            attemptsUsed: 0,
            remainingAttempts: 3
          },
          message: 'Test purchased successfully'
        })
      });
    });

    // Mock API response for test access check
    await page.route('**/api/psychometric-tests/*/access*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            canTakeTest: true,
            hasActivePurchase: true,
            remainingAttempts: 3,
            purchase: {
              _id: 'purchase-id-123',
              maxAttempts: 3,
              attemptsUsed: 0,
              remainingAttempts: 3
            }
          }
        })
      });
    });

    // Navigate to test purchase page (simulated)
    await page.goto('http://localhost:3000/app/tests/test-id-123');
    
    // Check if purchase button is available
    const purchaseButton = page.locator('[data-testid="purchase-test-btn"]');
    if (await purchaseButton.count() > 0) {
      await purchaseButton.click();
      
      // Verify purchase success (this would normally involve payment processing)
      await expect(page.locator('.success-message')).toContainText('Test purchased successfully');
    }
  });

  test('should start a test session after purchase', async () => {
    // Mock test session start
    await page.route('**/api/psychometric-tests/*/start-session', async route => {
      sessionId = `session_${Date.now()}_test123`;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            _id: 'session-doc-id',
            sessionId,
            user: 'test-user-id',
            test: {
              _id: 'test-id-123',
              title: 'Software Developer Assessment',
              type: 'comprehensive',
              timeLimit: 60,
              questions: []
            },
            status: 'active',
            startedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            currentQuestionIndex: 0,
            answers: {},
            timeSpent: 0
          },
          message: 'Test session started successfully'
        })
      });
    });

    // Mock test access check (user has valid purchase)
    await page.route('**/api/psychometric-tests/*/access*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            canTakeTest: true,
            hasActivePurchase: true,
            remainingAttempts: 3,
            purchase: {
              _id: 'purchase-id-123',
              maxAttempts: 3,
              attemptsUsed: 0,
              remainingAttempts: 3
            }
          }
        })
      });
    });

    // Navigate to test page
    await page.goto('http://localhost:3000/app/tests/test-id-123');
    
    // Start test session
    const startTestButton = page.locator('[data-testid="start-test-btn"]');
    if (await startTestButton.count() > 0) {
      await startTestButton.click();
      
      // Verify session started
      await expect(page.locator('.test-timer')).toBeVisible();
      await expect(page.locator('.question-container')).toBeVisible();
    }
  });

  test('should resume test session after page refresh', async () => {
    sessionId = 'session_existing_123';
    
    // Mock existing session check
    await page.route('**/api/psychometric-tests/*/access*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            canTakeTest: true,
            hasActivePurchase: true,
            remainingAttempts: 2,
            existingSession: {
              sessionId,
              status: 'active',
              currentQuestionIndex: 5,
              answers: {
                'q1': 'answer1',
                'q2': 'answer2'
              },
              timeSpent: 300,
              timeRemaining: 3300
            },
            purchase: {
              _id: 'purchase-id-123',
              maxAttempts: 3,
              attemptsUsed: 1,
              remainingAttempts: 2
            }
          }
        })
      });
    });

    // Mock session retrieval
    await page.route(`**/api/psychometric-tests/session/${sessionId}`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            sessionId,
            test: {
              title: 'Software Developer Assessment',
              type: 'comprehensive',
              timeLimit: 60,
              questions: [
                { _id: 'q1', question: 'Test Question 1' },
                { _id: 'q2', question: 'Test Question 2' },
                // ... more questions
              ]
            },
            status: 'active',
            currentQuestionIndex: 5,
            answers: {
              'q1': 'answer1',
              'q2': 'answer2'
            },
            timeSpent: 300,
            timeRemaining: 3300
          }
        })
      });
    });

    // Navigate to test page
    await page.goto('http://localhost:3000/app/tests/test-id-123');
    
    // Should show resume option
    const resumeButton = page.locator('[data-testid="resume-test-btn"]');
    if (await resumeButton.count() > 0) {
      await resumeButton.click();
      
      // Verify session resumed with previous state
      await expect(page.locator('.question-progress')).toContainText('Question 6'); // currentQuestionIndex + 1
      await expect(page.locator('.time-spent')).toContainText('5:00'); // 300 seconds = 5 minutes
    }
  });

  test('should auto-save progress during test', async () => {
    sessionId = 'session_autosave_123';
    let saveCount = 0;
    
    // Mock session update (auto-save)
    await page.route(`**/api/psychometric-tests/session/${sessionId}`, async route => {
      if (route.request().method() === 'PUT') {
        saveCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sessionId,
              status: 'active',
              lastActivityAt: new Date().toISOString()
            },
            message: 'Test session updated successfully'
          })
        });
      }
    });

    // Mock test session
    await page.evaluate((sessionId) => {
      window.testSession = {
        sessionId,
        currentQuestionIndex: 0,
        answers: {},
        timeSpent: 0
      };
    }, sessionId);

    // Navigate to test page (simulated in-progress test)
    await page.goto('http://localhost:3000/app/tests/test-id-123/take');
    
    // Simulate answering questions (this would trigger auto-save)
    await page.locator('[data-testid="answer-option-1"]').click();
    await page.locator('[data-testid="next-question-btn"]').click();
    
    // Wait for auto-save
    await page.waitForTimeout(2000);
    
    // Verify auto-save was called
    expect(saveCount).toBeGreaterThan(0);
  });

  test('should prevent test access when attempts exceeded', async () => {
    // Mock access check with no remaining attempts
    await page.route('**/api/psychometric-tests/*/access*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            canTakeTest: false,
            reason: 'Maximum attempts exceeded',
            hasActivePurchase: true,
            remainingAttempts: 0,
            purchase: {
              _id: 'purchase-id-123',
              maxAttempts: 3,
              attemptsUsed: 3,
              remainingAttempts: 0
            }
          }
        })
      });
    });

    // Navigate to test page
    await page.goto('http://localhost:3000/app/tests/test-id-123');
    
    // Should show access denied message
    await expect(page.locator('.access-denied-message')).toContainText('Maximum attempts exceeded');
    await expect(page.locator('[data-testid="start-test-btn"]')).not.toBeVisible();
  });

  test('should show payment required for unpaid test', async () => {
    // Mock access check with no purchase
    await page.route('**/api/psychometric-tests/*/access*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            canTakeTest: false,
            reason: 'No valid purchase found for this test',
            hasActivePurchase: false,
            remainingAttempts: 0
          }
        })
      });
    });

    // Navigate to test page
    await page.goto('http://localhost:3000/app/tests/test-id-123');
    
    // Should show purchase option
    await expect(page.locator('.payment-required-message')).toContainText('Purchase required');
    await expect(page.locator('[data-testid="purchase-test-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-test-btn"]')).not.toBeVisible();
  });

  test('should handle different question types during test', async () => {
    // Mock test with various question types
    const mockTest = {
      _id: 'test-id-123',
      title: 'Comprehensive Assessment',
      description: 'A test with various question types',
      type: 'comprehensive',
      timeLimit: 30,
      questions: [
        {
          _id: 'q1',
          question: 'What is 2 + 2?',
          type: 'multiple_choice',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          category: 'cognitive',
          traits: ['numerical-reasoning']
        },
        {
          _id: 'q2',
          question: 'A customer is angry about a delayed order. How would you respond?',
          type: 'scenario',
          options: [
            'Apologize and offer a discount',
            'Blame the shipping company',
            'Ignore the complaint',
            'Escalate immediately'
          ],
          correctAnswer: 'Apologize and offer a discount',
          category: 'behavioral',
          traits: ['situational-judgment', 'customer-service']
        },
        {
          _id: 'q3',
          question: 'I prefer working in teams rather than alone',
          type: 'scale',
          scaleRange: {
            min: 1,
            max: 5,
            labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
          },
          category: 'personality',
          traits: ['teamwork']
        },
        {
          _id: 'q4',
          question: 'Describe a complex technical problem you solved and your approach.',
          type: 'text',
          placeholder: 'Describe your approach in detail...',
          maxLength: 500,
          category: 'skills',
          traits: ['technical-problem-solving']
        },
        {
          _id: 'q5',
          question: 'I am comfortable working with ambiguous requirements.',
          type: 'boolean',
          options: ['True', 'False'],
          category: 'personality',
          traits: ['adaptability']
        }
      ]
    };

    // Mock test session with various question types
    await page.route('**/api/psychometric-tests/session/*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sessionId: 'session-123',
              test: mockTest,
              status: 'active',
              currentQuestionIndex: 0,
              answers: {},
              timeSpent: 0,
              timeRemaining: 1800
            }
          })
        });
      }
    });

    // Navigate to test taking page with mock data
    await page.goto('http://localhost:3000/app/tests/test-id-123/take');
    
    // Set test data in page
    await page.evaluate((testData) => {
      sessionStorage.setItem('psychometricTestData', JSON.stringify({
        test: testData,
        user: { id: 'test-user' },
        selectedJob: { id: 'job-123', title: 'Test Job' }
      }));
    }, mockTest);
    
    await page.reload();

    // Test multiple choice question
    await expect(page.locator('text=What is 2 + 2?')).toBeVisible();
    await expect(page.locator('text=Cognitive')).toBeVisible(); // Category chip
    await page.locator('text=4').click();
    
    // Navigate to scenario question
    await page.locator('[data-testid="next-question-btn"]').click();
    await expect(page.locator('text=A customer is angry')).toBeVisible();
    await expect(page.locator('text=Behavioral')).toBeVisible(); // Category chip
    await page.locator('text=Apologize and offer a discount').click();
    
    // Navigate to scale question
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator('text=I prefer working in teams')).toBeVisible();
    await expect(page.locator('text=Personality')).toBeVisible(); // Category chip
    // Click on slider (value 4)
    await page.locator('.MuiSlider-root').click();
    
    // Navigate to text question
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator('text=Describe a complex technical problem')).toBeVisible();
    await expect(page.locator('text=Skills')).toBeVisible(); // Category chip
    await page.locator('textarea').fill('I once had to debug a complex memory leak in a distributed system. I used profiling tools, analyzed heap dumps, and traced the issue to an unclosed connection pool.');
    
    // Navigate to boolean question
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator('text=I am comfortable working with ambiguous requirements')).toBeVisible();
    await page.locator('text=True').click();
    
    // Verify all question indicators show as completed (green dots)
    await expect(page.locator('.question-progress-dot[style*="success"]')).toHaveCount(5);
    
    // Submit test should be enabled
    await expect(page.locator('button:has-text("Submit Test")')).toBeEnabled();
  });

  test('should validate text input minimum length', async () => {
    const mockTest = {
      _id: 'test-text',
      title: 'Text Input Test',
      questions: [{
        _id: 'q1',
        question: 'Describe your experience with project management.',
        type: 'text',
        placeholder: 'Please provide details...',
        maxLength: 500,
        category: 'skills'
      }]
    };

    await page.evaluate((testData) => {
      sessionStorage.setItem('psychometricTestData', JSON.stringify({
        test: testData,
        user: { id: 'test-user' }
      }));
    }, mockTest);

    await page.goto('http://localhost:3000/app/tests/test-text/take');
    
    // Type short text (should not be valid)
    await page.locator('textarea').fill('Short');
    
    // Next/Submit button should be disabled
    await expect(page.locator('button:has-text("Submit Test")')).toBeDisabled();
    
    // Type longer text (should be valid)
    await page.locator('textarea').fill('I have extensive experience managing cross-functional teams and complex projects using Agile methodologies.');
    
    // Submit button should now be enabled
    await expect(page.locator('button:has-text("Submit Test")')).toBeEnabled();
    
    // Character count should be displayed
    await expect(page.locator('text=/\\d+ \/ 500 characters/')).toBeVisible();
  });
});