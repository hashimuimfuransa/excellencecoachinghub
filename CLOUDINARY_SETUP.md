# Cloudinary Setup Guide

## Backend Configuration

The Cloudinary configuration is now handled on the backend for security reasons.

### 1. Create a Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email

### 2. Get Your Credentials
1. Log into your Cloudinary dashboard
2. Go to the "Dashboard" section
3. Copy the following values:
   - **Cloud Name** (e.g., `your-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### 3. Add Environment Variables to Backend
Add these variables to your backend `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### 4. Install Cloudinary Package
In your backend directory, install the Cloudinary package:

```bash
npm install cloudinary
```

### 5. Restart Backend Server
```bash
npm run dev
```

## How It Works Now

✅ **Backend Upload**: All file uploads go through the backend API (`/api/upload/material`)
✅ **Secure Configuration**: Cloudinary credentials are stored securely on the backend
✅ **Authentication**: Only authenticated teachers and admins can upload files
✅ **File Validation**: Backend validates file types and sizes before upload
✅ **Progress Tracking**: Real-time upload progress is still available

## API Endpoints

- **POST** `/api/upload/material` - Upload a material file
- **DELETE** `/api/upload/material/:publicId` - Delete a material file

## File Types Supported

- **Documents**: PDF, DOC, DOCX, PPT, PPTX
- **Images**: JPEG, JPG, PNG, GIF
- **Videos**: MP4, AVI, MOV
- **Audio**: MP3, WAV, M4A

## File Size Limit

- Maximum file size: 100MB per file

## Security Features

- Authentication required for all upload operations
- Role-based access (teachers and admins only)
- File type validation
- File size limits
- Secure Cloudinary configuration on backend

## Troubleshooting

**"cloud_name is disabled" Error**: This means the backend Cloudinary environment variables are not set.

**Upload Fails**: Check that your backend server is running and the Cloudinary package is installed.

**Authentication Error**: Make sure you're logged in as a teacher or admin.

**File Type Error**: Only supported file types are allowed (see list above).

**File Size Error**: Files larger than 100MB will be rejected.
