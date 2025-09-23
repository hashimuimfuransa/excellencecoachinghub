import { test, expect } from '@playwright/test';

test.describe('Social Network Video Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the social network page
    await page.goto('/social-network');
    
    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 10000 });
  });

  test('should maintain video mute state when liking posts', async ({ page }) => {
    // Find the first post with a video
    const firstPostWithVideo = page.locator('[data-testid="post-card"]').filter({ hasText: /video|Video/ }).first();
    await expect(firstPostWithVideo).toBeVisible();

    // Find the video element within the post
    const videoElement = firstPostWithVideo.locator('video').first();
    await expect(videoElement).toBeVisible();

    // Check initial mute state - videos should start muted for auto-play compatibility
    const initialMuted = await videoElement.getAttribute('muted');
    expect(initialMuted).toBe('');

    // Unmute the video by clicking the volume button
    const volumeButton = firstPostWithVideo.locator('[data-testid="volume-button"]').first();
    if (await volumeButton.isVisible()) {
      await volumeButton.click();
      
      // Verify video is now unmuted
      const afterUnmute = await videoElement.getAttribute('muted');
      expect(afterUnmute).toBe(null);
    }

    // Get initial like count
    const likeButton = firstPostWithVideo.locator('[data-testid="like-button"]').first();
    const initialLikeText = await likeButton.textContent();
    const initialLikeCount = parseInt(initialLikeText?.match(/\d+/)?.[0] || '0');

    // Click the like button
    await likeButton.click();

    // Wait for the like count to update (optimistic update)
    await expect(likeButton).toContainText(`${initialLikeCount + 1}`);

    // Verify the video's mute state is preserved after liking
    const afterLikeMuted = await videoElement.getAttribute('muted');
    expect(afterLikeMuted).toBe(null); // Should still be unmuted
  });

  test('should display correct video dimensions', async ({ page }) => {
    // Test single video height (550px)
    const singleVideoPost = page.locator('[data-testid="post-card"]')
      .filter({ has: page.locator('video') })
      .filter({ hasNot: page.locator('[data-testid="video-grid"]') })
      .first();

    if (await singleVideoPost.isVisible()) {
      const singleVideo = singleVideoPost.locator('video').first();
      const singleVideoHeight = await singleVideo.boundingBox();
      
      // Allow some tolerance for CSS calculations
      expect(singleVideoHeight?.height).toBeGreaterThan(530);
      expect(singleVideoHeight?.height).toBeLessThan(570);
    }

    // Test grid video container height (440px) and items height (220px)
    const gridVideoPost = page.locator('[data-testid="post-card"]')
      .filter({ has: page.locator('[data-testid="video-grid"]') })
      .first();

    if (await gridVideoPost.isVisible()) {
      const gridContainer = gridVideoPost.locator('[data-testid="video-grid"]').first();
      const gridContainerHeight = await gridContainer.boundingBox();
      
      // Grid container should be around 440px
      expect(gridContainerHeight?.height).toBeGreaterThan(420);
      expect(gridContainerHeight?.height).toBeLessThan(460);

      // Grid video items should be around 220px
      const gridVideoItem = gridContainer.locator('video').first();
      const gridVideoHeight = await gridVideoItem.boundingBox();
      
      expect(gridVideoHeight?.height).toBeGreaterThan(200);
      expect(gridVideoHeight?.height).toBeLessThan(240);
    }
  });

  test('should open comment dialog correctly', async ({ page }) => {
    // Find first post
    const firstPost = page.locator('[data-testid="post-card"]').first();
    await expect(firstPost).toBeVisible();

    // Click the comment button
    const commentButton = firstPost.locator('[data-testid="comment-button"]').first();
    await commentButton.click();

    // Verify comment dialog opens
    const commentDialog = page.locator('[data-testid="comment-dialog"]');
    await expect(commentDialog).toBeVisible();

    // Verify comment input is present
    const commentInput = commentDialog.locator('input[placeholder*="comment" i], textarea[placeholder*="comment" i]');
    await expect(commentInput).toBeVisible();

    // Close dialog
    const closeButton = commentDialog.locator('[data-testid="close-dialog"], button:has-text("Cancel"), [aria-label="close"]');
    if (await closeButton.first().isVisible()) {
      await closeButton.first().click();
    }

    // Verify dialog is closed
    await expect(commentDialog).not.toBeVisible();
  });

  test('should handle multiple video interactions without interference', async ({ page }) => {
    // Find all posts with videos
    const postsWithVideos = page.locator('[data-testid="post-card"]').filter({ has: page.locator('video') });
    const videoCount = await postsWithVideos.count();

    if (videoCount >= 2) {
      // Test first video
      const firstVideoPost = postsWithVideos.nth(0);
      const firstVideo = firstVideoPost.locator('video').first();
      const firstVolumeButton = firstVideoPost.locator('[data-testid="volume-button"]').first();

      // Unmute first video if volume button is present
      if (await firstVolumeButton.isVisible()) {
        await firstVolumeButton.click();
      }

      // Test second video
      const secondVideoPost = postsWithVideos.nth(1);
      const secondVideo = secondVideoPost.locator('video').first();
      const secondVolumeButton = secondVideoPost.locator('[data-testid="volume-button"]').first();

      // Second video should remain muted initially
      const secondVideoMuted = await secondVideo.getAttribute('muted');
      expect(secondVideoMuted).toBe('');

      // Like the second post
      const secondLikeButton = secondVideoPost.locator('[data-testid="like-button"]').first();
      await secondLikeButton.click();

      // Verify first video's unmute state is preserved
      const firstVideoMuted = await firstVideo.getAttribute('muted');
      expect(firstVideoMuted).toBe(null); // Should still be unmuted

      // Verify second video's mute state is preserved
      const secondVideoMutedAfter = await secondVideo.getAttribute('muted');
      expect(secondVideoMutedAfter).toBe(''); // Should still be muted
    }
  });

  test('should correctly update like counts without affecting video states', async ({ page }) => {
    // Find multiple posts for comprehensive testing
    const posts = page.locator('[data-testid="post-card"]');
    const postCount = Math.min(await posts.count(), 3); // Test up to 3 posts

    for (let i = 0; i < postCount; i++) {
      const post = posts.nth(i);
      const likeButton = post.locator('[data-testid="like-button"]').first();
      
      // Get initial like count
      const initialLikeText = await likeButton.textContent();
      const initialLikeCount = parseInt(initialLikeText?.match(/\d+/)?.[0] || '0');
      
      // Click like button
      await likeButton.click();
      
      // Verify like count increased
      await expect(likeButton).toContainText(`${initialLikeCount + 1}`);
      
      // If this post has a video, verify video states are not affected
      const video = post.locator('video').first();
      if (await video.isVisible()) {
        // Video should maintain its default muted state after liking
        const videoMuted = await video.getAttribute('muted');
        expect(videoMuted).toBe(''); // Should be muted (default state)
      }
    }
  });

  test('should handle video playback controls independently', async ({ page }) => {
    // Find posts with videos
    const postsWithVideos = page.locator('[data-testid="post-card"]').filter({ has: page.locator('video') });
    const videoCount = await postsWithVideos.count();

    if (videoCount >= 1) {
      const videoPost = postsWithVideos.first();
      const video = videoPost.locator('video').first();
      const volumeButton = videoPost.locator('[data-testid="volume-button"]').first();

      // Test volume control if available
      if (await volumeButton.isVisible()) {
        // Initial state should be muted
        const initialMuted = await video.getAttribute('muted');
        expect(initialMuted).toBe('');

        // Click to unmute
        await volumeButton.click();
        
        // Should be unmuted now
        const afterUnmute = await video.getAttribute('muted');
        expect(afterUnmute).toBe(null);

        // Click to mute again
        await volumeButton.click();
        
        // Should be muted again
        const afterMute = await video.getAttribute('muted');
        expect(afterMute).toBe('');
      }

      // Test that video controls don't affect other posts
      const likeButton = videoPost.locator('[data-testid="like-button"]').first();
      await likeButton.click();
      
      // Video state should remain consistent after liking
      const finalMuted = await video.getAttribute('muted');
      expect(typeof finalMuted).toBe('string'); // Should be muted or unmuted consistently
    }
  });
});