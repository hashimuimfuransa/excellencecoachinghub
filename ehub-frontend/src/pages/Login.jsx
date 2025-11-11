import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');

  useEffect(() => {
    // Load Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        console.log('Google Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || '192720000772-1qkm1i0lmg52b17vaslf0gm56lll3p0m.apps.googleusercontent.com',
          callback: handleGoogleSignIn,
        });
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleGoogleSignIn = async (response) => {
    setGoogleLoading(true);
    try {
      // Send the Google JWT token to your backend
      const result = await login({ googleToken: response.credential });
      if (result.success) {
        // Check if user has selected level (for students/parents)
        const { user } = result;
        if ((user?.role === 'student' || user?.role === 'parent') && !user?.level) {
          navigate('/select-level');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    }
    setGoogleLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData);

    if (result.success) {
      const { user } = result;
      // Check if user needs to select level (student or parent without level)
      if ((user?.role === 'student' || user?.role === 'parent') && !user?.level) {
        navigate('/select-level');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-14 sm:w-16 h-14 sm:h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white font-bold text-xl sm:text-2xl">e</span>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome back! 👋</h2>
          <p className="text-xs sm:text-sm text-primary-600 font-medium mb-1">ecoach by Excellence Coaching Hub (ECH)</p>
          <p className="text-sm sm:text-base text-gray-600">Continue your learning journey</p>
        </div>

        <div className="card">
          {/* Google Sign-In Button */}
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (window.google) {
                  window.google.accounts.id.prompt();
                }
              }}
              disabled={googleLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input-field"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm font-medium mb-2">🎓 New to ecoach?</p>
              <p className="text-blue-700 text-sm">
                If this is your first time or you don&apos;t have an account yet,
                please{' '}
                <Link to="/register" className="text-primary-600 hover:text-primary-500 font-semibold underline">
                  create a new account
                </Link>{' '}
                to get started with your learning journey!
              </p>
            </div>
            <p className="text-gray-600">
              Already have an account?{' '}
              <span className="text-primary-600 font-medium">Sign in above</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;