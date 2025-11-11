import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-primary-100 text-primary-800 mb-4">
                🎓 Excellence Coaching Hub (ECH) Presents
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-primary-600">ecoach</span>
              <br />
              <span className="text-lg sm:text-2xl md:text-3xl font-semibold text-gray-700">Your Learning Adventure Awaits!</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              A premium bilingual e-learning platform designed for nursery and primary students.
              Learn, play, and grow with interactive lessons in English and French through gamified education.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/register" className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                🚀 Get Started Free
              </Link>
              <Link to="/login" className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                Sign In
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Bilingual Learning</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Gamified Experience</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Parent Dashboard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-200 rounded-full opacity-20 animate-bounce-slow shadow-lg"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-green-200 rounded-full opacity-20 animate-pulse-slow shadow-lg"></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-blue-200 rounded-full opacity-20 animate-ping shadow-lg"></div>
        <div className="absolute bottom-40 right-10 w-24 h-24 bg-purple-200 rounded-full opacity-10 animate-pulse shadow-lg"></div>
        <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-pink-200 rounded-full opacity-15 animate-bounce shadow-lg"></div>
      </div>

      {/* Features Section */}
      <div className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Why Choose Ehub?
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Everything you need for effective online learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎓</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Interactive Learning</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Engaging videos, quizzes, and activities designed specifically for young learners
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🌍</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Bilingual Education</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Learn in both English and French with native speakers and cultural content
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏆</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Gamification</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Earn points, badges, and climb the leaderboard while learning
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Types Section */}
      <div className="py-16 sm:py-24 bg-educational-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Built for Everyone
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Different roles, one amazing learning experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👨‍🎓</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Students</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Watch educational videos, complete homework, chat with peers, and track progress
              </p>
              <ul className="text-left text-xs sm:text-sm text-gray-600 space-y-1">
                <li>• Interactive video lessons</li>
                <li>• Homework submission</li>
                <li>• Peer collaboration</li>
                <li>• Progress tracking</li>
              </ul>
            </div>

            <div className="card text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👩‍🏫</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Teachers</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Create content, manage students, review submissions, and host live sessions
              </p>
              <ul className="text-left text-xs sm:text-sm text-gray-600 space-y-1">
                <li>• Content creation tools</li>
                <li>• Student management</li>
                <li>• Live video sessions</li>
                <li>• Progress analytics</li>
              </ul>
            </div>

            <div className="card text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👨‍👩‍👧</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Parents</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Monitor your child&apos;s progress, communicate with teachers, and stay involved
              </p>
              <ul className="text-left text-xs sm:text-sm text-gray-600 space-y-1">
                <li>• Child progress reports</li>
                <li>• Teacher communication</li>
                <li>• Activity monitoring</li>
                <li>• Performance insights</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">e</span>
              </div>
              <span className="text-xl font-bold">ecoach</span>
            </div>
            <p className="text-gray-400 mb-4">
              Making education fun and accessible for everyone
            </p>
            <p className="text-sm text-gray-500">
              © 2024 Ehub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;