import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');

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
      // Check if user needs to select level (student without level)
      if (user?.role === 'student' && !user?.level) {
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
    <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-white font-bold text-2xl">e</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('welcome_back')}</h2>
        </div>

        {/* Increased padding and min-height for better mobile experience */}
        <div className="card p-8 min-h-[500px] flex flex-col justify-center">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-3">
                {t('email_or_phone')}
              </label>
              {/* Increased input size for better mobile touch targets */}
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                className="input-field text-base py-4 px-4 text-lg"
                placeholder={t('enter_email_or_phone')}
                value={formData.identifier}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-3">
                {t('password')}
              </label>
              <div className="relative">
                {/* Increased input size for better mobile touch targets */}
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-field pr-12 text-base py-4 px-4 text-lg"
                  placeholder={t('enter_password')}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              {/* Increased button size for better mobile touch targets */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed py-4 text-lg font-medium"
              >
                {loading ? t('signing_in') + '...' : t('sign_in')}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-base">
              {t('no_account_yet')}{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-500 font-medium text-base">
                {t('register')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;