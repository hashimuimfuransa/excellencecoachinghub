/**
 * Test file to demonstrate persistent daily email tracking
 * This shows how the email tracking persists even after application restart
 */

import {
  canSendDailyEmail,
  markEmailSentToday,
  getDailyEmailStatus,
  clearDailyEmailTracker,
  getAllTrackedEmails,
  resetEmailTracking
} from './emailjsService';

// Test functions to demonstrate persistence
export const testPersistentEmailTracking = () => {
  console.log('🧪 Testing Persistent Daily Email Tracking');
  console.log('==========================================');

  const testEmail = 'test@example.com';
  
  // Check initial status
  console.log('1. Initial status:');
  console.log('   Can send:', canSendDailyEmail(testEmail));
  console.log('   Status:', getDailyEmailStatus(testEmail));
  
  // Mark as sent
  console.log('\n2. Marking email as sent today...');
  markEmailSentToday(testEmail);
  
  // Check status after marking
  console.log('3. Status after marking as sent:');
  console.log('   Can send:', canSendDailyEmail(testEmail));
  console.log('   Status:', getDailyEmailStatus(testEmail));
  
  // Show all tracked emails
  console.log('\n4. All tracked emails:');
  console.log('   Tracked emails:', getAllTrackedEmails());
  
  console.log('\n✅ Test complete! Email tracking is now persisted in localStorage.');
  console.log('💡 Even if you restart the application, the tracking will persist.');
  console.log('💡 The email will not be sent again today for this email address.');
};

// Test function to reset tracking for testing purposes
export const resetTestTracking = (email?: string) => {
  if (email) {
    resetEmailTracking(email);
    console.log(`🔄 Reset tracking for ${email}`);
  } else {
    clearDailyEmailTracker();
    console.log('🧹 Cleared all email tracking');
  }
};

// Test function to simulate email sending with daily limit check
export const simulateEmailSending = (email: string, jobCount: number = 5) => {
  console.log(`📧 Simulating job recommendation email to ${email}`);
  
  if (!canSendDailyEmail(email)) {
    console.log('❌ Cannot send - daily limit reached');
    const status = getDailyEmailStatus(email);
    console.log(`   Last sent: ${status.lastSent}`);
    return false;
  }
  
  console.log('✅ Email can be sent - no email sent today');
  console.log(`📬 Simulating sending ${jobCount} job recommendations...`);
  
  // Mark as sent (simulating successful email send)
  markEmailSentToday(email);
  
  console.log('✅ Email sent and tracking updated');
  return true;
};