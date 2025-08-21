# Repository Rules

## Project Structure
This is a full-stack web application with multiple components:
- `backend/` - Node.js/Express backend with MongoDB
- `job-portal/` - React frontend for job portal
- `homepage/` - React landing page
- `elearning/` - React e-learning platform
- `super-admin-dashboard/` - React super admin dashboard

## Test Framework
targetFramework: Playwright

## Database
- MongoDB with Mongoose ODM
- Models located in `backend/src/models/`

## AI Services
- Uses Google Gemini AI for various features
- AI service located in `backend/src/services/aiService.ts`

## API Structure
- RESTful APIs with Express.js
- Authentication middleware
- Routes organized by feature in `backend/src/routes/`