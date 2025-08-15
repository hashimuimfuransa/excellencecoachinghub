// Test script to verify raise hand functionality
// This can be run in browser console during a live session

function testRaiseHandFunctionality() {
  console.log('🧪 Testing Raise Hand Functionality...');
  
  // Test 1: Check if raise hand button exists for students
  const raiseHandButton = document.querySelector('[data-testid="raise-hand-button"], button[title*="Raise hand"]');
  if (raiseHandButton) {
    console.log('✅ Raise hand button found');
  } else {
    console.log('❌ Raise hand button not found - make sure you are a student in a live session');
  }
  
  // Test 2: Check if HMS actions are available
  if (typeof window.hmsActions !== 'undefined' || document.querySelector('[data-hms-store]')) {
    console.log('✅ HMS SDK detected');
  } else {
    console.log('❌ HMS SDK not detected');
  }
  
  // Test 3: Check if notifications are supported
  if ('Notification' in window) {
    console.log('✅ Browser notifications supported');
    console.log('Notification permission:', Notification.permission);
    
    if (Notification.permission === 'default') {
      console.log('💡 You can request notification permission for better experience');
    }
  } else {
    console.log('❌ Browser notifications not supported');
  }
  
  // Test 4: Look for raise hand related elements
  const handIcons = document.querySelectorAll('[data-testid*="hand"], svg[data-testid*="pan-tool"]');
  console.log(`Found ${handIcons.length} hand-related icons`);
  
  // Test 5: Check for participant panels
  const participantPanels = document.querySelectorAll('[data-testid*="participant"], [role="dialog"]:has-text("Participants")');
  console.log(`Found ${participantPanels.length} participant panel elements`);
  
  console.log('🧪 Test completed. Check the logs above for results.');
}

// Helper function to simulate raise hand (for testing)
function simulateRaiseHand() {
  const button = document.querySelector('button[title*="Raise hand"], button:has(svg[data-testid="PanToolIcon"])');
  if (button) {
    console.log('🤚 Simulating raise hand click...');
    button.click();
    
    // Check if button state changed
    setTimeout(() => {
      const newTitle = button.getAttribute('title') || button.getAttribute('aria-label');
      console.log('Button title after click:', newTitle);
      
      if (newTitle && newTitle.includes('lower')) {
        console.log('✅ Button state changed to "lower hand"');
      } else {
        console.log('❌ Button state might not have changed');
      }
    }, 1000);
  } else {
    console.log('❌ Raise hand button not found for simulation');
  }
}

// Helper function to check HMS store state
function checkHMSStore() {
  try {
    // This would work if we could access the HMS store
    console.log('🔍 Checking HMS store...');
    
    // Look for HMS related elements
    const hmsElements = document.querySelectorAll('[data-hms*=""], [class*="hms-"], video[autoplay]');
    console.log(`Found ${hmsElements.length} HMS-related elements`);
    
    // Check for video tracks
    const videos = document.querySelectorAll('video');
    console.log(`Found ${videos.length} video elements`);
    
    videos.forEach((video, index) => {
      console.log(`Video ${index + 1}:`, {
        src: video.src,
        srcObject: !!video.srcObject,
        muted: video.muted,
        autoplay: video.autoplay
      });
    });
    
  } catch (error) {
    console.log('❌ Error checking HMS store:', error);
  }
}

// Auto-run basic test
console.log('🚀 Raise Hand Test Suite loaded');
console.log('Run testRaiseHandFunctionality() to test');
console.log('Run simulateRaiseHand() to simulate clicking the button');
console.log('Run checkHMSStore() to check HMS state');

// Run basic test immediately
testRaiseHandFunctionality();