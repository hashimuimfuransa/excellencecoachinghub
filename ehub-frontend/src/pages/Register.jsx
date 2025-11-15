import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    identifier: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, user } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('passwords_do_not_match'));
      return;
    }

    // Split full name into first and last name for backend
    const nameParts = formData.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    if (!firstName) {
      setError(t('enter_full_name'));
      return;
    }

    setLoading(true);

    const result = await register({
      identifier: formData.identifier,
      firstName: firstName,
      lastName: lastName,
      password: formData.password,
      role: formData.role,
    });

    if (result.success) {
      // User is automatically logged in after successful registration
      // Navigate based on selected role
      if (formData.role === 'student') {
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
    // Further reduced padding on mobile devices to match login page
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-1 px-4 sm:px-6 lg:px-8 md:py-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="mb-3">
            <div className="w-12 sm:w-14 h-12 sm:h-14 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
              <span className="text-white font-bold text-lg sm:text-xl">e</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{t('join_ecoach')}</h2>
        </div>

        <div className="card">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                {t('full_name')}
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="input-field text-sm"
                placeholder={t('enter_full_name')}
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                {t('email_or_phone')}
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                className="input-field text-sm"
                placeholder={t('enter_email_or_phone')}
                value={formData.identifier}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                {t('i_am_a')}
              </label>
              <select
                id="role"
                name="role"
                className="input-field text-sm"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="student">{t('student')}</option>
                <option value="teacher">{t('teacher')}</option>
                <option value="parent">{t('parent')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-field pr-10 text-sm"
                  placeholder={t('create_password')}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                {t('confirm_password')}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="input-field pr-10 text-sm"
                  placeholder={t('confirm_password')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed py-2.5 text-sm"
              >
                {loading ? t('creating_account') + '...' : t('create_account')}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-gray-600 text-sm">
              {t('already_have_account')}{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium text-sm">
                {t('sign_in')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;