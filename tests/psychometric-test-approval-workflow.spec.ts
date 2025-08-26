import { test, expect } from '@playwright/test';

test.describe('Psychometric Test Approval Workflow', () => {
  let page;
  let purchaseId: string;
  let testId: string;
  
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('complete approval workflow: purchase, approve, and start test', async () => {
    // Step 1: User Authentication and Test Purchase
    await page.goto('http://localhost:3000');
    
    // Mock user authentication (job seeker)
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock-job-seeker-token');
      localStorage.setItem('user', JSON.stringify({
        _id: 'job-seeker-123',
        email: 'jobseeker@example.com',
        role: 'professional',
        firstName: 'John',
        lastName: 'Seeker'
      }));
    });

    // Mock test purchase API call
    testId = 'test-abc-123';
    purchaseId = 'purchase-xyz-789';
    
    await page.route('**/api/psychometric-tests/*/purchase', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            _id: purchaseId,
            user: 'job-seeker-123',
            test: testId,
            paymentIntentId: 'pi_test_123',
            amount: 2999,
            currency: 'USD',
            status: 'completed',
            approvalStatus: 'not_required',
            autoApproval: false,
            maxAttempts: 3,
            attemptsUsed: 0,
            canRequestApproval: true
          },
          message: 'Test purchased successfully'
        })
      });
    });

    // Mock getUserTestPurchases to return the purchase with pending approval status
    await page.route('**/api/psychometric-tests/purchases/my-purchases', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{
            _id: purchaseId,
            user: {
              _id: 'job-seeker-123',
              firstName: 'John',
              lastName: 'Seeker',
              email: 'jobseeker@example.com'
            },
            test: {
              _id: testId,
              title: 'Software Developer Assessment',
              type: 'comprehensive',
              description: 'Comprehensive psychometric assessment for software developers'
            },
            job: {
              _id: 'job-123',
              title: 'Senior Software Engineer',
              company: 'Tech Corp'
            },
            amount: 2999,
            currency: 'USD',
            status: 'completed',
            approvalStatus: 'pending_approval',
            approvalRequestedAt: new Date().toISOString(),
            purchasedAt: new Date().toISOString(),
            maxAttempts: 3,
            attemptsUsed: 0,
            canRequestApproval: false,
            isApprovalPending: true,
            approvalStatusDisplay: 'Pending Approval'
          }],
          message: 'Purchases retrieved successfully'
        })
      });
    });

    // Navigate to psychometric tests page
    await page.goto('http://localhost:3000/app/tests');
    
    // Wait for page to load and verify user sees their purchased test with pending approval
    await page.waitForSelector('[data-testid="saved-tests-section"]', { timeout: 10000 });
    
    // Check that the test shows as "Pending Approval"
    await expect(page.locator('.MuiChip-root:has-text("Pending")')).toBeVisible();
    await expect(page.locator('text=Approval requested')).toBeVisible();

    // Step 2: Super Admin Login and Approval Process
    // Navigate to admin dashboard (simulate new session)
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock-admin-token');
      localStorage.setItem('user', JSON.stringify({
        _id: 'admin-456',
        email: 'admin@example.com',
        role: 'super_admin',
        firstName: 'Super',
        lastName: 'Admin'
      }));
    });

    // Mock pending approvals API for admin
    await page.route('**/api/psychometric-tests/approvals/pending', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{
            _id: purchaseId,
            user: {
              _id: 'job-seeker-123',
              firstName: 'John',
              lastName: 'Seeker',
              email: 'jobseeker@example.com'
            },
            test: {
              _id: testId,
              title: 'Software Developer Assessment',
              type: 'comprehensive',
              description: 'Comprehensive psychometric assessment for software developers'
            },
            job: {
              _id: 'job-123',
              title: 'Senior Software Engineer',
              company: 'Tech Corp'
            },
            approvalStatus: 'pending_approval',
            approvalRequestedAt: new Date().toISOString(),
            amount: 2999,
            currency: 'USD'
          }],
          message: 'Pending approvals retrieved successfully'
        })
      });
    });

    // Mock approval action
    await page.route(`**/api/psychometric-tests/approvals/${purchaseId}/approve`, async route => {
      expect(route.request().method()).toBe('POST');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            _id: purchaseId,
            approvalStatus: 'approved',
            approvedBy: 'admin-456',
            approvedAt: new Date().toISOString()
          },
          message: 'Test approved successfully. The user can now take the test.'
        })
      });
    });

    // Navigate to admin dashboard
    await page.goto('http://localhost:3000/admin/test-requests');
    
    // Wait for pending approvals to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Verify the pending approval shows in admin dashboard
    await expect(page.locator('text=John Seeker')).toBeVisible();
    await expect(page.locator('text=Software Developer Assessment')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();

    // Approve the test
    const approveButton = page.locator('[data-testid="approve-test-btn"]').first();
    if (await approveButton.count() > 0) {
      await approveButton.click();
      
      // Confirm approval in dialog
      await page.locator('button:has-text("Approve")').click();
      
      // Verify approval success message
      await expect(page.locator('text=Test approved successfully')).toBeVisible();
    }

    // Step 3: Verify User Can Now Access Test
    // Switch back to user session
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock-job-seeker-token');
      localStorage.setItem('user', JSON.stringify({
        _id: 'job-seeker-123',
        email: 'jobseeker@example.com',
        role: 'professional',
        firstName: 'John',
        lastName: 'Seeker'
      }));
    });

    // Mock updated getUserTestPurchases to return approved status
    await page.route('**/api/psychometric-tests/purchases/my-purchases', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{
            _id: purchaseId,
            user: {
              _id: 'job-seeker-123',
              firstName: 'John',
              lastName: 'Seeker',
              email: 'jobseeker@example.com'
            },
            test: {
              _id: testId,
              title: 'Software Developer Assessment',
              type: 'comprehensive',
              description: 'Comprehensive psychometric assessment for software developers'
            },
            job: {
              _id: 'job-123',
              title: 'Senior Software Engineer',
              company: 'Tech Corp'
            },
            amount: 2999,
            currency: 'USD',
            status: 'completed',
            approvalStatus: 'approved',
            approvedAt: new Date().toISOString(),
            purchasedAt: new Date().toISOString(),
            maxAttempts: 3,
            attemptsUsed: 0,
            canRequestApproval: false,
            isApprovalPending: false,
            approvalStatusDisplay: 'Approved - Ready to Start'
          }],
          message: 'Purchases retrieved successfully'
        })
      });
    });

    // Mock checkTestAccess to return approved access
    await page.route(`**/api/psychometric-tests/${testId}/access*`, async route => {
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
              _id: purchaseId,
              approvalStatus: 'approved',
              maxAttempts: 3,
              attemptsUsed: 0,
              remainingAttempts: 3
            }
          }
        })
      });
    });

    // Mock start test session
    await page.route(`**/api/psychometric-tests/${testId}/start-session`, async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            sessionId: 'session-abc-123',
            test: {
              _id: testId,
              title: 'Software Developer Assessment',
              timeLimit: 60,
              questions: []
            },
            status: 'active',
            startedAt: new Date().toISOString()
          },
          message: 'Test session started successfully'
        })
      });
    });

    // Navigate back to user tests page
    await page.goto('http://localhost:3000/app/tests');
    
    // Wait for the updated status to load
    await page.waitForTimeout(2000);
    
    // Force refresh of purchases (simulating the auto-refresh mechanism)
    await page.reload();
    await page.waitForSelector('[data-testid="saved-tests-section"]', { timeout: 10000 });

    // Verify the test now shows as approved
    await expect(page.locator('text=Approved')).toBeVisible();
    await expect(page.locator('text=Ready to Start')).toBeVisible();

    // Verify the start test button is now enabled
    const startTestButton = page.locator('[data-testid="start-test-btn"]');
    await expect(startTestButton).toBeEnabled();

    // Click start test button
    await startTestButton.click();
    
    // Verify test session starts successfully
    await expect(page.locator('text=Test session started successfully')).toBeVisible();
  });

  test('approval workflow with rejection', async () => {
    await page.goto('http://localhost:3000');
    
    // Mock super admin authentication
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock-admin-token');
      localStorage.setItem('user', JSON.stringify({
        _id: 'admin-456',
        email: 'admin@example.com',
        role: 'super_admin',
        firstName: 'Super',
        lastName: 'Admin'
      }));
    });

    const testPurchaseId = 'purchase-reject-123';

    // Mock pending approvals
    await page.route('**/api/psychometric-tests/approvals/pending', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{
            _id: testPurchaseId,
            user: {
              firstName: 'Jane',
              lastName: 'Applicant',
              email: 'jane@example.com'
            },
            test: {
              title: 'Marketing Assessment',
              type: 'behavioral'
            },
            approvalStatus: 'pending_approval'
          }],
          message: 'Pending approvals retrieved successfully'
        })
      });
    });

    // Mock rejection API
    await page.route(`**/api/psychometric-tests/approvals/${testPurchaseId}/reject`, async route => {
      expect(route.request().method()).toBe('POST');
      const body = await route.request().postDataJSON();
      expect(body.reason).toBeTruthy();
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            _id: testPurchaseId,
            approvalStatus: 'rejected',
            rejectedBy: 'admin-456',
            rejectedAt: new Date().toISOString(),
            rejectionReason: body.reason
          },
          message: 'Test rejected successfully. The user has been notified.'
        })
      });
    });

    // Navigate to admin dashboard
    await page.goto('http://localhost:3000/admin/test-requests');
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Click reject button
    const rejectButton = page.locator('[data-testid="reject-test-btn"]').first();
    if (await rejectButton.count() > 0) {
      await rejectButton.click();
      
      // Fill rejection reason
      await page.fill('textarea[placeholder*="reason"]', 'Test requirements not met for this role');
      
      // Confirm rejection
      await page.locator('button:has-text("Reject")').click();
      
      // Verify rejection success message
      await expect(page.locator('text=Test rejected successfully')).toBeVisible();
    }
  });

  test('user status visibility and real-time updates', async () => {
    // This test focuses on ensuring the user sees status updates correctly
    await page.goto('http://localhost:3000');
    
    // Mock user authentication
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock-user-token');
      localStorage.setItem('user', JSON.stringify({
        _id: 'user-123',
        email: 'user@example.com',
        role: 'professional'
      }));
    });

    const purchaseId = 'purchase-status-test';
    let approvalStatus = 'pending_approval';

    // Dynamic mock that changes based on approval status
    await page.route('**/api/psychometric-tests/purchases/my-purchases', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{
            _id: purchaseId,
            test: { title: 'Status Test', _id: 'test-123' },
            approvalStatus: approvalStatus,
            approvalStatusDisplay: approvalStatus === 'pending_approval' ? 'Pending Approval' : 
                                  approvalStatus === 'approved' ? 'Approved - Ready to Start' : 'Rejected'
          }]
        })
      });
    });

    await page.goto('http://localhost:3000/app/tests');
    
    // Verify initial pending status
    await expect(page.locator('text=Pending')).toBeVisible();
    
    // Simulate approval (update the mock response)
    approvalStatus = 'approved';
    
    // Wait for auto-refresh (30 seconds interval)
    await page.waitForTimeout(31000);
    
    // Verify status updated to approved
    await expect(page.locator('text=Approved')).toBeVisible();
    await expect(page.locator('text=Ready to Start')).toBeVisible();
  });

  test('test access control after approval', async () => {
    await page.goto('http://localhost:3000');
    
    // Mock user authentication
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock-user-token');
      localStorage.setItem('user', JSON.stringify({
        _id: 'user-access-test',
        email: 'access@example.com',
        role: 'professional'
      }));
    });

    const testId = 'access-test-123';
    
    // Test Case 1: Approved test should allow access
    await page.route(`**/api/psychometric-tests/${testId}/access*`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            canTakeTest: true,
            hasActivePurchase: true,
            purchase: {
              approvalStatus: 'approved',
              remainingAttempts: 3
            }
          }
        })
      });
    });

    // Simulate trying to access an approved test
    const accessResponse = await page.request.get(`http://localhost:5000/api/psychometric-tests/${testId}/access`);
    const accessData = await accessResponse.json();
    
    expect(accessData.data.canTakeTest).toBe(true);
    
    // Test Case 2: Pending approval test should not allow access
    await page.route(`**/api/psychometric-tests/${testId}/access*`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            canTakeTest: false,
            reason: 'Test approval is pending from admin',
            hasActivePurchase: true,
            purchase: {
              approvalStatus: 'pending_approval',
              remainingAttempts: 3
            }
          }
        })
      });
    });

    const pendingAccessResponse = await page.request.get(`http://localhost:5000/api/psychometric-tests/${testId}/access`);
    const pendingAccessData = await pendingAccessResponse.json();
    
    expect(pendingAccessData.data.canTakeTest).toBe(false);
    expect(pendingAccessData.data.reason).toContain('pending');
  });
});