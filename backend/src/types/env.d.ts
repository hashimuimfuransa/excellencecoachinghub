declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      MONGODB_URI: string;
      JWT_SECRET: string;
      JWT_EXPIRE: string;
      FRONTEND_URL: string;
      RATE_LIMIT_WINDOW_MS: string;
      RATE_LIMIT_MAX_REQUESTS: string;
      CLOUDINARY_CLOUD_NAME: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_API_SECRET: string;
      EMAIL_FROM: string;
      EMAIL_HOST: string;
      EMAIL_PORT: string;
      EMAIL_USER: string;
      EMAIL_PASS: string;
      AGORA_APP_ID: string;
      AGORA_APP_CERTIFICATE: string;
      HMS_ACCESS_KEY: string;
      HMS_SECRET: string;
      OPENAI_API_KEY: string;
      GEMINI_API_KEY: string;
      PDFTRON_LICENSE_KEY: string;
      GOOGLE_CLIENT_ID: string;
    }
  }
}

export {};
