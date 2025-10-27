# Database Connection Guide

## Overview
The job portal application is now configured to prioritize real database data over mock data. The super admin dashboard and all profile pages will attempt to fetch data from actual database endpoints first, and only fall back to mock data if the database is unavailable.

## Current Status
✅ **Frontend Ready**: All components are configured to use real database data
🔗 **API Endpoints**: Frontend is making calls to the correct backend endpoints
⚠️ **Backend Required**: You need to implement the backend API endpoints listed below

## Required Backend API Endpoints

### Super Admin Dashboard Endpoints

#### Core Dashboard Data
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/system/alerts` - System alerts
- `GET /api/admin/activity/recent?limit=10` - Recent activity

#### User Management
- `GET /api/admin/users` - Get all users with pagination and filtering
- `GET /api/admin/users/:id` - Get specific user
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `PUT /api/admin/users/:id/suspend` - Suspend user
- `PUT /api/admin/users/:id/activate` - Activate user

#### Job Management
- `GET /api/admin/jobs` - Get all jobs with pagination and filtering
- `PUT /api/admin/jobs/:id/approve` - Approve job
- `PUT /api/admin/jobs/:id/reject` - Reject job
- `PUT /api/admin/jobs/:id/feature` - Feature job
- `PUT /api/admin/jobs/:id/unfeature` - Unfeature job

#### Application Management
- `GET /api/admin/applications` - Get all applications with pagination and filtering

#### Optional Features (will show empty if not implemented)
- `GET /api/admin/courses` - Course management
- `GET /api/admin/tests` - Test management
- `GET /api/admin/certificates` - Certificate management

### Profile System Endpoints

#### User Profile Management
- `GET /api/users/:id/profile` - Get user profile
- `PUT /api/users/:id/profile` - Update user profile
- `POST /api/users/:id/profile-picture` - Upload profile picture
- `PUT /api/users/:id/change-password` - Change password
- `GET /api/users/:id/stats` - Get user statistics
- `GET /api/users/:id/activity` - Get user activity feed
- `PUT /api/users/:id/privacy-settings` - Update privacy settings
- `GET /api/users/:id/privacy-settings` - Get privacy settings

## Expected Data Formats

### Dashboard Stats Response
```json
{
  "totalUsers": 15420,
  "totalJobs": 2847,
  "totalApplications": 8932,
  "totalCourses": 456,
  "totalTests": 234,
  "totalInterviews": 1876,
  "totalCertificates": 3421,
  "activeUsers": 1247,
  "pendingApplications": 156,
  "systemHealth": "good",
  "usersByRole": {
    "job_seeker": 8934,
    "employer": 2847,
    "teacher": 1456,
    "student": 2034,
    "admin": 149
  },
  "jobsByStatus": {
    "active": 1847,
    "closed": 756,
    "draft": 244
  },
  "applicationsByStatus": {
    "pending": 2847,
    "reviewed": 3456,
    "accepted": 1234,
    "rejected": 1395
  },
  "monthlyGrowth": {
    "users": 1247,
    "jobs": 234,
    "applications": 1876
  }
}
```

### User List Response
```json
{
  "users": [
    {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "job_seeker",
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-20T15:30:00Z"
    }
  ],
  "total": 1500,
  "page": 1,
  "totalPages": 150
}
```

### Job List Response
```json
{
  "jobs": [
    {
      "_id": "job_id",
      "title": "Senior Frontend Developer",
      "description": "Job description...",
      "company": "TechCorp Inc.",
      "location": "San Francisco, CA",
      "type": "full-time",
      "salary": {
        "min": 120000,
        "max": 150000,
        "currency": "USD"
      },
      "requirements": ["React", "TypeScript", "Node.js"],
      "benefits": ["Health Insurance", "401k", "Remote Work"],
      "status": "active",
      "postedBy": "employer_id",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-20T15:30:00Z",
      "featured": true,
      "applicationCount": 45,
      "viewCount": 230
    }
  ],
  "total": 500,
  "page": 1,
  "totalPages": 50
}
```

## How the Frontend Works Now

### 1. Database First Approach
- All API calls attempt to fetch data from your database endpoints first
- Clear logging shows when database connections succeed or fail
- Graceful fallback to mock data ensures the application always works

### 2. Logging Output
When you run the application, you'll see console messages like:
- `🔍 SuperAdminService: Attempting to fetch users from database API...`
- `✅ SuperAdminService: Successfully loaded users from database:` (if backend works)
- `❌ SuperAdminService: Database API not available for users, using fallback data:` (if backend unavailable)

### 3. Profile System
- Complete profile management with tabs for personal info, security, privacy
- Professional profile with work experience, education, skills
- Profile settings with notifications, privacy, appearance preferences
- All data is saved to database when endpoints are available

## Next Steps

1. **Implement Backend API**: Create the endpoints listed above in your backend
2. **Database Schema**: Set up your database with appropriate tables/collections
3. **Authentication**: Ensure API endpoints are properly secured
4. **Testing**: Test each endpoint with the exact data formats shown above

## Benefits of This Approach

✅ **Development Friendly**: Frontend works immediately with mock data  
✅ **Production Ready**: Automatically switches to real data when backend is ready  
✅ **Easy Debugging**: Clear logging shows exactly what's happening  
✅ **Graceful Degradation**: Application never crashes due to missing backend  
✅ **Real User Experience**: All UI components are fully functional  

The application is now ready for production use - you just need to implement the backend endpoints to enable real database connectivity.