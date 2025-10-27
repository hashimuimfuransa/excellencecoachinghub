# PDFTron WebViewer Environment Setup Guide

## 🔑 Where to Add Environment Variables

You need to create environment files in **two locations** for the Enhanced Material Viewer to work properly.

## 📁 Frontend Environment Variables (eLearning)

### 1. Create `.env.local` file in the `elearning/` directory:

```bash
# Navigate to elearning directory
cd elearning

# Create the environment file
touch .env.local
```

### 2. Add these variables to `elearning/.env.local`:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000

# PDFTron WebViewer License Key
# Get your license key from: https://www.pdftron.com/licensing/
REACT_APP_PDFTRON_LICENSE_KEY=your_pdftron_license_key_here

# Google OAuth (if needed)
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here

# App Configuration
REACT_APP_NAME=Excellence Coaching Hub - eLearning
REACT_APP_VERSION=1.0.0

# Development Configuration
REACT_APP_ENVIRONMENT=development
```

## 📁 Backend Environment Variables (Backend)

### 1. Create `.env` file in the `backend/` directory:

```bash
# Navigate to backend directory
cd backend

# Create the environment file
touch .env
```

### 2. Add these variables to `backend/.env`:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/excellencecoachinghub

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d

# Server Configuration
NODE_ENV=development
PORT=5000

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration
EMAIL_FROM=noreply@excellencecoachinghub.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# AI Services
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key

# Video Services
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate
HMS_ACCESS_KEY=your_hms_access_key
HMS_SECRET=your_hms_secret
```

## 🔑 How to Get PDFTron License Key

### Step 1: Sign Up for PDFTron
1. Go to [https://www.pdftron.com/](https://www.pdftron.com/)
2. Click "Get Started" or "Sign Up"
3. Create your account

### Step 2: Get Your License Key
1. Log into your PDFTron dashboard
2. Navigate to "Licensing" or "API Keys"
3. Copy your license key
4. It should look like: `demo:1700000000000:your_key_here`

### Step 3: Add to Environment
Replace `your_pdftron_license_key_here` in your `.env.local` file with your actual license key.

## 🚀 Quick Setup Commands

### For Windows (PowerShell):
```powershell
# Frontend
cd elearning
New-Item -Path ".env.local" -ItemType File
Add-Content -Path ".env.local" -Value "REACT_APP_PDFTRON_LICENSE_KEY=your_key_here"

# Backend  
cd ..\backend
New-Item -Path ".env" -ItemType File
Add-Content -Path ".env" -Value "MONGODB_URI=mongodb://localhost:27017/excellencecoachinghub"
```

### For Mac/Linux (Terminal):
```bash
# Frontend
cd elearning
echo "REACT_APP_PDFTRON_LICENSE_KEY=your_key_here" > .env.local

# Backend
cd ../backend
echo "MONGODB_URI=mongodb://localhost:27017/excellencecoachinghub" > .env
```

## 🔍 Verify Your Setup

### 1. Check Environment Variables:
```bash
# Frontend
cd elearning
npm run dev

# Backend
cd backend
npm run dev
```

### 2. Test WebViewer:
1. Start both frontend and backend servers
2. Navigate to a course material
3. Try viewing a PDF, DOCX, or PPTX file
4. Check browser console for any errors

### 3. Test Annotations:
1. Open a document in the viewer
2. Try adding a comment or annotation
3. Verify it saves to the database

## 🐛 Troubleshooting

### Common Issues:

#### 1. "WebViewer not loading"
- Check if `REACT_APP_PDFTRON_LICENSE_KEY` is set correctly
- Verify the license key is valid
- Check browser console for errors

#### 2. "Annotations not saving"
- Ensure backend server is running
- Check if `REACT_APP_API_URL` points to correct backend
- Verify database connection

#### 3. "Files not found"
- Make sure WebViewer files are in `public/webviewer/`
- Run `npm install @pdftron/webviewer` again if needed

## 📝 Important Notes

### Security:
- **Never commit `.env` or `.env.local` files to git**
- Add them to `.gitignore` if not already there
- Use different keys for development and production

### License Types:
- **Demo License**: Free, but with watermarks
- **Trial License**: 30-day free trial
- **Production License**: Paid, no watermarks

### File Locations:
```
excellencecoachinghub-main/
├── elearning/
│   └── .env.local          ← Frontend environment variables
├── backend/
│   └── .env                ← Backend environment variables
└── README.md
```

## 🎯 Next Steps

1. **Create the environment files** as shown above
2. **Get your PDFTron license key** from their website
3. **Add the license key** to your `.env.local` file
4. **Start the development servers**
5. **Test the enhanced material viewer**

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Check the browser console for error messages
4. Ensure both frontend and backend servers are running

The Enhanced Material Viewer will work with any supported file format once the environment variables are properly configured!
