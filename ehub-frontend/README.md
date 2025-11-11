# ecoach - Bilingual E-Learning Platform

A modern, responsive e-learning platform designed for nursery and primary students, built with React, Tailwind CSS, and Socket.io.

## 🎯 Overview

ecoach connects students, teachers, and parents in a comprehensive learning ecosystem. The platform supports bilingual education (English/French) and provides interactive learning experiences with gamification elements.

## ✨ Features

### 👨‍🎓 Student Features
- **Interactive Learning**: Watch educational videos and complete assignments
- **Bilingual Support**: Choose between English and French content
- **Progress Tracking**: Monitor learning progress with visual indicators
- **Gamification**: Earn points, badges, and climb leaderboards
- **Peer Collaboration**: Chat with classmates and teachers
- **Offline Access**: Download content for offline learning
- **Homework Submission**: Submit assignments with multimedia support

### 👩‍🏫 Teacher Features
- **Content Management**: Upload videos and create homework assignments
- **Student Oversight**: Monitor student progress and performance
- **Live Sessions**: Host interactive video classes
- **Homework Review**: Evaluate and provide feedback on submissions
- **Communication**: Direct messaging with students and parents
- **Analytics**: Track class performance and engagement

### 👨‍👩‍👧 Parent Features
- **Child Monitoring**: View child's progress, grades, and activity
- **Teacher Communication**: Message teachers directly
- **Progress Reports**: Access detailed learning analytics
- **Resource Access**: View educational content and assignments

## 🛠️ Tech Stack

- **Frontend**: React 18 with Hooks
- **Styling**: Tailwind CSS with custom educational theme
- **Routing**: React Router DOM
- **HTTP Client**: Axios with interceptors
- **Real-time Communication**: Socket.io-client
- **State Management**: React Context API
- **Offline Storage**: IndexedDB with localStorage fallback
- **Build Tool**: Create React App

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API server running

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ehub-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   REACT_APP_API_BASE_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
ehub-frontend/
├── src/
│   ├── api/                 # API service functions
│   │   ├── axiosClient.js   # Axios configuration
│   │   ├── authApi.js       # Authentication API
│   │   ├── videoApi.js      # Video management API
│   │   ├── homeworkApi.js   # Homework API
│   │   ├── chatApi.js       # Chat API
│   │   └── parentApi.js     # Parent API
│   ├── components/          # Reusable components
│   │   ├── ui/              # UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   └── LanguageSelector.jsx
│   │   ├── forms/           # Form components
│   │   │   ├── LoginForm.jsx
│   │   │   └── RegisterForm.jsx
│   │   └── dashboard/       # Dashboard components
│   │       ├── StudentDashboard.jsx
│   │       ├── TeacherDashboard.jsx
│   │       └── ParentDashboard.jsx
│   ├── context/             # React contexts
│   │   ├── AuthContext.jsx  # Authentication state
│   │   └── SocketContext.jsx # Socket.io state
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.js       # Authentication hook
│   │   └── useOfflineCache.js # Offline caching hook
│   ├── pages/               # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Videos.jsx
│   │   ├── Homework.jsx
│   │   ├── Chat.jsx
│   │   └── Leaderboard.jsx
│   ├── utils/               # Utility functions
│   │   └── languageOptions.js
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # App entry point
│   └── index.css            # Global styles
├── public/
│   ├── index.html
│   └── favicon.ico
├── .env.example             # Environment variables template
├── package.json
├── tailwind.config.js       # Tailwind configuration
└── README.md
```

## 🎨 Design System

### Colors
- **Primary**: Blue tones for educational elements
- **Educational**: Light blue backgrounds for learning spaces
- **Accent**: Green for success, Yellow for warnings

### Typography
- **Primary Font**: Nunito (rounded, child-friendly)
- **Headings**: Comic Neue for playful elements
- **Sizes**: Responsive scaling for all devices

### Components
- **Buttons**: Rounded corners with hover animations
- **Cards**: Shadow effects with smooth transitions
- **Forms**: Clean inputs with focus states
- **Navigation**: Intuitive sidebar and top navigation

## 🔐 Authentication Flow

1. **Registration**: Users select role (Student/Teacher/Parent)
2. **Students**: Choose level (Nursery/Primary) and language
3. **Login**: JWT-based authentication with localStorage
4. **Protected Routes**: Role-based access control

## 💬 Real-time Features

- **Chat System**: Socket.io-powered messaging
- **Notifications**: Real-time updates for assignments, grades
- **Live Sessions**: Integrated video conferencing
- **Collaboration**: Peer-to-peer communication

## 📱 Offline Support

- **IndexedDB**: Client-side storage for videos and content
- **Cache Management**: Automatic sync when online
- **Homework Drafts**: Save work offline, submit when connected

## 🏆 Gamification

- **Points System**: Earn points for completing activities
- **Badges**: Achievement system with progress tracking
- **Leaderboards**: Competitive rankings with filters
- **Progress Visualization**: Charts and progress bars

## 📊 Responsive Design

- **Mobile First**: Optimized for tablets and phones
- **Tablet Support**: Dedicated layouts for medium screens
- **Desktop**: Full-featured experience
- **Accessibility**: WCAG compliant with keyboard navigation

## 🔧 Development

### Code Quality
- **ESLint**: Code linting and formatting
- **Prettier**: Consistent code formatting
- **TypeScript Ready**: Prepared for TypeScript migration

### Scripts
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run lint       # Lint code
npm run lint:fix   # Fix linting issues
```

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ for educational excellence - ecoach**