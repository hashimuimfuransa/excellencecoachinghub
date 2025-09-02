import { test, expect } from '@playwright/test';

test.describe('AI Matched Jobs Debug', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the job portal login page
    await page.goto('http://localhost:5173/auth/login');
    
    // Login with a test user (you'll need to adjust these credentials)
    await page.fill('input[type="email"]', 'student@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete and redirect to jobs page
    await page.waitForURL('**/jobs**', { timeout: 10000 });
  });

  test('debug AI matched jobs not displaying', async ({ page }) => {
    console.log('🔍 Starting AI matched jobs debug test');

    // Listen for console messages
    page.on('console', msg => {
      if (msg.text().includes('AI') || msg.text().includes('matched') || msg.text().includes('🤖')) {
        console.log('Frontend log:', msg.text());
      }
    });

    // Listen for network requests
    page.on('request', request => {
      if (request.url().includes('ai-matched')) {
        console.log('🌐 AI matched jobs request:', request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('ai-matched')) {
        console.log('📡 AI matched jobs response:', response.status(), response.statusText());
      }
    });

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');

    // Take a screenshot to see current state
    await page.screenshot({ path: 'ai-jobs-before-tab-click.png', fullPage: true });

    // Look for the Smart Matches tab
    const smartMatchesTab = page.locator('text=Smart Job Matches');
    await expect(smartMatchesTab).toBeVisible({ timeout: 10000 });

    console.log('🔍 Found Smart Matches tab, clicking...');
    
    // Click on Smart Matches tab
    await smartMatchesTab.click();

    // Wait for any network requests to complete
    await page.waitForTimeout(3000);

    // Take screenshot after clicking the tab
    await page.screenshot({ path: 'ai-jobs-after-tab-click.png', fullPage: true });

    // Check if loading indicator is visible
    const loadingIndicator = page.locator('text=AI is analyzing jobs for you...');
    if (await loadingIndicator.isVisible()) {
      console.log('🤖 AI loading indicator is visible, waiting for completion...');
      await loadingIndicator.waitFor({ state: 'detached', timeout: 30000 });
    }

    // Wait for AI jobs to load
    await page.waitForTimeout(2000);

    // Check if jobs are displayed
    const jobCards = page.locator('[data-testid="job-card"], .MuiPaper-root').filter({ hasText: /Match|%/ });
    const jobCount = await jobCards.count();
    
    console.log(`🎯 Found ${jobCount} job cards with match percentages`);

    // Check for "No Smart Matches Found" message
    const noMatchesMessage = page.locator('text=No Smart Matches Found');
    const hasNoMatches = await noMatchesMessage.isVisible();
    
    if (hasNoMatches) {
      console.log('⚠️ "No Smart Matches Found" message is visible');
    } else {
      console.log('✅ No "No Smart Matches Found" message - jobs should be visible');
    }

    // Check for any error messages
    const errorMessages = page.locator('[class*="error"], [class*="Error"], text=Error');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      console.log('❌ Found error messages:');
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorMessages.nth(i).textContent();
        console.log(`Error ${i + 1}: ${errorText}`);
      }
    }

    // Check the tab chip count (should show number of matches)
    const tabChip = page.locator('text=Smart Job Matches').locator('..').locator('.MuiChip-root');
    if (await tabChip.isVisible()) {
      const chipText = await tabChip.textContent();
      console.log(`📊 Tab chip shows: ${chipText} matches`);
    } else {
      console.log('📊 No chip visible on Smart Matches tab (might indicate 0 matches)');
    }

    // Check AI metadata display
    const metadataSection = page.locator('text=Smart Matches').locator('..');
    if (await metadataSection.isVisible()) {
      console.log('📈 AI metadata section is visible');
    }

    // Take final screenshot
    await page.screenshot({ path: 'ai-jobs-final-state.png', fullPage: true });

    // Log current URL and page state
    console.log('🌐 Current URL:', page.url());
    
    // Get page title and any visible text content
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);

    // If no jobs are visible but backend returned matches, there's a disconnect
    if (jobCount === 0 && hasNoMatches) {
      console.log('🚨 ISSUE DETECTED: Backend returns matches but frontend shows "No Smart Matches Found"');
      
      // Check browser developer tools network tab equivalent
      console.log('🔍 Checking for JavaScript errors or network issues...');
      
      // This will help us see if there are any JavaScript errors
      const logs = [];
      page.on('pageerror', error => {
        logs.push(`Page error: ${error.message}`);
      });
      
      if (logs.length > 0) {
        console.log('📝 JavaScript errors found:');
        logs.forEach(log => console.log(log));
      }
    }

    // For debugging, let's also check local storage and session storage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    console.log('🔑 Auth token exists:', !!token);

    const user = await page.evaluate(() => localStorage.getItem('user'));
    console.log('👤 User data exists:', !!user);
  });
});