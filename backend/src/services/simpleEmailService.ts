// Simple email verification service that doesn't require external email providers
// This stores verification codes in memory and logs them to console

interface VerificationCode {
  email: string;
  code: string;
  userId: string;
  type: 'email_verification' | 'password_reset';
  expiresAt: Date;
  createdAt: Date;
}

// In-memory storage for verification codes (in production, use Redis or database)
const verificationCodes = new Map<string, VerificationCode>();

// Generate a random verification code
export const generateVerificationCode = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Store verification code
export const storeVerificationCode = (
  email: string,
  userId: string,
  type: 'email_verification' | 'password_reset' = 'email_verification'
): string => {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  const verificationData: VerificationCode = {
    email,
    code,
    userId,
    type,
    expiresAt,
    createdAt: new Date()
  };
  
  verificationCodes.set(code, verificationData);
  
  // Clean up expired codes
  cleanupExpiredCodes();
  
  return code;
};

// Verify code
export const verifyCode = (code: string): VerificationCode | null => {
  const verificationData = verificationCodes.get(code);
  
  if (!verificationData) {
    return null;
  }
  
  if (verificationData.expiresAt < new Date()) {
    verificationCodes.delete(code);
    return null;
  }
  
  return verificationData;
};

// Remove used code
export const removeVerificationCode = (code: string): void => {
  verificationCodes.delete(code);
};

// Clean up expired codes
const cleanupExpiredCodes = (): void => {
  const now = new Date();
  for (const [code, data] of verificationCodes.entries()) {
    if (data.expiresAt < now) {
      verificationCodes.delete(code);
    }
  }
};

// Send verification email (console logging for demo)
export const sendVerificationEmail = async (
  email: string,
  firstName: string,
  verificationCode: string
): Promise<void> => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'https://exjobnet.com'}/verify-email?token=${verificationCode}`;
  
  console.log('\n📧 EMAIL VERIFICATION SENT');
  console.log('==========================');
  console.log(`📧 To: ${email}`);
  console.log(`👤 Name: ${firstName}`);
  console.log(`🔐 Verification Code: ${verificationCode}`);
  console.log(`🔗 Verification URL: ${verificationUrl}`);
  console.log(`⏰ Expires: ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString()}`);
  console.log('==========================\n');
  
  // In a real application, you would send the actual email here
  // For now, we just log it to console so you can copy the verification URL
};

// Send password reset email (console logging for demo)
export const sendPasswordResetEmail = async (
  email: string,
  firstName: string,
  resetCode: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'https://exjobnet.com'}/reset-password?token=${resetCode}`;
  
  console.log('\n🔐 PASSWORD RESET EMAIL SENT');
  console.log('=============================');
  console.log(`📧 To: ${email}`);
  console.log(`👤 Name: ${firstName}`);
  console.log(`🔑 Reset Code: ${resetCode}`);
  console.log(`🔗 Reset URL: ${resetUrl}`);
  console.log(`⏰ Expires: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleString()}`); // 10 minutes
  console.log('=============================\n');
};

// Send welcome email (console logging for demo)
export const sendWelcomeEmail = async (
  email: string,
  firstName: string,
  role: string
): Promise<void> => {
  const dashboardUrl = `${process.env.FRONTEND_URL || 'https://exjobnet.com'}/dashboard`;
  
  console.log('\n🎉 WELCOME EMAIL SENT');
  console.log('=====================');
  console.log(`📧 To: ${email}`);
  console.log(`👤 Name: ${firstName}`);
  console.log(`👥 Role: ${role}`);
  console.log(`🔗 Dashboard URL: ${dashboardUrl}`);
  console.log(`✅ Email Status: Auto-verified`);
  console.log('=====================\n');
  
  console.log(`Welcome to Excellence Coaching Hub, ${firstName}!`);
  console.log(`Your account has been successfully created with the role: ${role}`);
  console.log(`Your email (${email}) has been automatically verified.`);
  console.log(`You can now access your dashboard at: ${dashboardUrl}`);
  console.log('Thank you for joining Excellence Coaching Hub!');
  console.log('=====================\n');
};

// Get all verification codes (for debugging)
export const getAllVerificationCodes = (): VerificationCode[] => {
  cleanupExpiredCodes();
  return Array.from(verificationCodes.values());
};

// Get verification codes for a specific email
export const getVerificationCodesForEmail = (email: string): VerificationCode[] => {
  cleanupExpiredCodes();
  return Array.from(verificationCodes.values()).filter(code => code.email === email);
};

export default {
  generateVerificationCode,
  storeVerificationCode,
  verifyCode,
  removeVerificationCode,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  getAllVerificationCodes,
  getVerificationCodesForEmail
};
