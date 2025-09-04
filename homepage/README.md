# Excellence Coaching Hub - Homepage

A modern, responsive homepage for Excellence Coaching Hub, Africa's leading career development platform. Built with React, TypeScript, and Material-UI.

## 🌟 Features

### Core Features
- **Modern Design**: Clean, professional design with smooth animations
- **Responsive Layout**: Optimized for all devices (mobile, tablet, desktop)
- **Authentication System**: Complete login/register/password reset flow
- **Platform Integration**: Links to e-learning and job preparation platforms
- **Performance Optimized**: Fast loading with code splitting and optimization

### Sections
- **Hero Section**: Compelling introduction with call-to-action
- **About Section**: Vision, mission, and core values
- **How It Works**: 5-step process explanation
- **Platform Links**: Direct access to learning and job platforms
- **Testimonials**: Success stories from graduates
- **Footer**: Complete site navigation and contact information

### Technical Features
- **TypeScript**: Full type safety and better development experience
- **Material-UI**: Consistent design system and components
- **Framer Motion**: Smooth animations and transitions
- **React Hook Form**: Efficient form handling with validation
- **Axios**: HTTP client with interceptors and error handling
- **React Router**: Client-side routing with protected routes
- **Toast Notifications**: User feedback for actions

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Backend API running (for authentication features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd excellencecoachinghub-main/homepage
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_ELEARNING_URL=http://localhost:3000
   REACT_APP_JOBS_URL=http://localhost:3001
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3002`

## 📁 Project Structure

```
homepage/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── favicon.ico
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── AboutSection.tsx
│   │   ├── HowItWorksSection.tsx
│   │   ├── PlatformLinksSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   └── Footer.tsx
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx
│   ├── pages/              # Page components
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   └── ResetPasswordPage.tsx
│   ├── services/           # API services
│   │   ├── api.ts
│   │   └── authService.ts
│   ├── App.tsx
│   └── index.tsx
├── package.json
├── tsconfig.json
└── README.md
```

## 🎨 Design System

### Colors
- **Primary**: #1976d2 (Blue)
- **Secondary**: #9c27b0 (Purple)
- **Background**: #fafafa
- **Text Primary**: #212121
- **Text Secondary**: #757575

### Typography
- **Font Family**: Inter
- **Headings**: 600-700 weight
- **Body**: 400-500 weight
- **Buttons**: 600 weight

### Components
- **Border Radius**: 8-16px
- **Shadows**: Subtle elevation
- **Animations**: Smooth transitions with Framer Motion

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking

## 🌐 API Integration

The homepage integrates with the backend API for:

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Error Handling
- Network errors are handled gracefully
- User-friendly error messages
- Automatic token refresh (if implemented)
- Redirect to login on authentication errors

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 600px
- **Tablet**: 600px - 960px
- **Desktop**: > 960px

### Features
- Mobile-first design approach
- Touch-friendly interface
- Optimized images and assets
- Fast loading on all devices

## 🔒 Security Features

- **Input Validation**: Client-side and server-side validation
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Secure API requests
- **Secure Storage**: Tokens stored securely
- **HTTPS Ready**: Production-ready security headers

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables for Production
```env
REACT_APP_API_URL=https://api.excellencecoachinghub.com/api
REACT_APP_ELEARNING_URL=https://learn.excellencecoachinghub.com
REACT_APP_JOBS_URL=https://exjobnet.com
```

### Deployment Options
- **Netlify**: Automatic deployments from Git
- **Vercel**: Zero-config deployments
- **AWS S3 + CloudFront**: Scalable static hosting
- **Traditional Web Servers**: Apache, Nginx

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Testing (Recommended)
- Cypress or Playwright for end-to-end testing
- Test critical user flows (registration, login, navigation)

## 📈 Performance Optimization

### Implemented Optimizations
- **Code Splitting**: Lazy loading of routes
- **Image Optimization**: WebP format with fallbacks
- **Bundle Analysis**: Webpack bundle analyzer
- **Caching**: Service worker for offline support
- **Compression**: Gzip compression for assets

### Performance Metrics
- **Lighthouse Score**: 90+ for all categories
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

## 🔄 Integration with Other Platforms

### E-Learning Platform
- Seamless navigation to learning modules
- Single sign-on (SSO) integration
- Progress tracking across platforms

### Job Preparation Platform
- Direct access to job listings
- Unified user profiles
- Shared assessment results

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow TypeScript best practices
- Use ESLint and Prettier for formatting
- Write meaningful commit messages
- Add comments for complex logic

## 📞 Support

For support and questions:
- **Email**: dev@excellencecoachinghub.com
- **Documentation**: [Link to docs]
- **Issues**: GitHub Issues

## 📄 License

This project is proprietary software owned by Excellence Coaching Hub.

---

**Excellence Coaching Hub** - Empowering Africa's workforce through innovative education and career development.