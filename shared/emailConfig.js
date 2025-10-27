// Shared EmailJS configuration across all platforms
// This ensures all platforms use the same service ID and template IDs

const SHARED_EMAILJS_CONFIG = {
  SERVICE_ID: 'service_vtor3y8', // Your EmailJS service ID
  VERIFICATION_TEMPLATE_ID: 'template_sikm5se', // Your EmailJS template ID for email verification
  PASSWORD_RESET_TEMPLATE_ID: 'template_9apzq9s', // Your EmailJS template ID for password reset
  WELCOME_TEMPLATE_ID: 'template_9apzq9s', // Your EmailJS template ID for welcome email (same as password reset)
  EMPLOYER_WELCOME_TEMPLATE_ID: 'template_o0k3j0q', // Your EmailJS template ID for employer welcome email
  PUBLIC_KEY: 'VLY7_POWX21gRHMof' // Your EmailJS public key
};

// Platform-specific configuration
const PLATFORM_CONFIG = {
  elearning: {
    from_name: 'Excellence Coaching Hub E-Learning',
    platform_name: 'E-Learning Platform'
  },
  jobPortal: {
    from_name: 'Excellence Coaching Hub Job Portal',
    platform_name: 'Job Portal'
  },
  homepage: {
    from_name: 'Excellence Coaching Hub',
    platform_name: 'Homepage'
  },
  superAdminDashboard: {
    from_name: 'Excellence Coaching Hub Admin',
    platform_name: 'Admin Panel'
  }
};

module.exports = {
  SHARED_EMAILJS_CONFIG,
  PLATFORM_CONFIG
};

// For ES6 modules
export {
  SHARED_EMAILJS_CONFIG,
  PLATFORM_CONFIG
};