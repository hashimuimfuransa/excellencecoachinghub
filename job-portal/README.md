# Excellence Coaching Hub - Job Portal

A comprehensive job portal application built with React, TypeScript, and Material-UI that connects job seekers, students, and employers.

## Features

### For Job Seekers & Students
- **Job Search & Discovery**: Browse and search for job opportunities
- **Profile Management**: Create detailed profiles with skills, experience, and education
- **Job Applications**: Apply for jobs with resume and cover letter
- **Psychometric Tests**: Take personality and skill assessments
- **AI Interviews**: Practice with AI-powered interview simulations
- **Certificates**: Earn and manage job-related certificates
- **Dashboard**: Track applications and progress

### For Employers
- **Job Posting**: Create and manage job listings
- **Candidate Management**: Review applications and candidate profiles
- **Assessment Tools**: Access psychometric test results and AI interview scores
- **Analytics**: Track job performance and candidate metrics

### For Administrators
- **User Management**: Manage all users and roles
- **Content Curation**: Curate job listings and courses
- **Analytics**: System-wide analytics and reporting
- **Test Management**: Create and manage psychometric tests

## Technology Stack

- **Frontend**: React 19, TypeScript, Material-UI
- **Routing**: React Router v6
- **State Management**: React Context API + Custom Hooks
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Styling**: Material-UI + Emotion

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd job-portal
```

2. Install dependencies
```bash
npm install
```

3. Create environment file
```bash
cp .env.example .env
```

4. Update environment variables in `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Excellence Coaching Hub - Job Portal
VITE_APP_VERSION=1.0.0
```

5. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, Theme)
├── hooks/              # Custom React hooks
├── layouts/            # Layout components
├── pages/              # Page components
├── services/           # API services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── App.tsx             # Main App component
└── main.tsx           # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

The application connects to the backend API at the URL specified in `VITE_API_URL`. Make sure the backend server is running before starting the frontend.

### Authentication
The app uses JWT tokens for authentication. Tokens are stored in localStorage and automatically included in API requests.

### API Endpoints
- `/auth/*` - Authentication endpoints
- `/jobs/*` - Job management
- `/job-applications/*` - Application management
- `/profiles/*` - User profiles
- `/psychometric-tests/*` - Assessment tests
- `/ai-interviews/*` - AI interview system
- `/job-certificates/*` - Certificate management

## User Roles

1. **Student** - Can browse jobs, take tests, apply for entry-level positions
2. **Job Seeker** - Full access to job search and application features
3. **Employer** - Can post jobs, review applications, access candidate data
4. **Admin** - System administration and content management
5. **Super Admin** - Full system access and user management

## Features in Development

- Advanced job filtering and search
- Real-time notifications
- Video interview integration
- Advanced analytics dashboard
- Mobile app support
- Integration with external job boards

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@excellencecoachinghub.com or create an issue in the repository.