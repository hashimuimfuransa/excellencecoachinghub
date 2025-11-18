import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';
import { Widget } from '@uploadcare/react-widget';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import BottomNavbar from '../components/ui/BottomNavbar';
import { levelOptions } from '../utils/languageOptions';

const HomeworkHelpStudent = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Get level label from level value
  const getLevelLabel = (levelValue) => {
    for (const category in levelOptions) {
      const level = levelOptions[category].find(l => l.value === levelValue);
      if (level) return level.label;
    }
    return levelValue;
  };
  
  const [helpData, setHelpData] = useState({
    homeworkTitle: '',
    level: user?.level || '',
    message: '',
    fileUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get Uploadcare public key from environment or window object
  const uploadcarePublicKey = (
    (typeof process !== 'undefined' && process.env?.REACT_APP_UPLOADCARE_PUBLIC_KEY)
    || (typeof window !== 'undefined' && window.UPLOADCARE_PUBLIC_KEY)
    || ''
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setHelpData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validate required fields
    if (!helpData.homeworkTitle || !helpData.level || !helpData.message) {
      setError(t('please_fill_required_fields'));
      setLoading(false);
      return;
    }

    try {
      // Create form data with text fields and file URL
      const formData = {
        homeworkTitle: helpData.homeworkTitle,
        level: helpData.level,
        message: helpData.message,
        fileUrl: helpData.fileUrl
      };

      // Submit to backend
      await homeworkApi.uploadHomeworkHelp(formData);

      setSuccess(true);
      setTimeout(() => {
        navigate('/homework');
      }, 2000);
    } catch (err) {
      setError(t('failed_submit_help_request'));
      console.error('Error submitting help request:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 pb-20 md:pb-4 pt-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-indigo-700 mb-3 transition-colors duration-200"
          >
            <span className="mr-1">←</span> {t('back_to_dashboard')}
          </button>
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl">📤</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('get_help')}</h1>
            <p className="text-gray-600">{t('upload_for_help')}</p>
          </div>
        </div>

        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg mb-6 animate-fade-in-up">
            <div className="flex items-center">
              <span className="text-xl mr-2">✅</span>
              <p className="font-medium">{t('help_submitted')}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 animate-fade-in-up">
            <div className="flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="block text-gray-700 font-semibold text-sm mb-1">{t('title')}</label>
              <input
                type="text"
                name="homeworkTitle"
                value={helpData.homeworkTitle}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-gray-700 placeholder-gray-400"
                placeholder={t('e.g._math')}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-gray-700 font-semibold text-sm mb-1">{t('level')}</label>
              <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700">
                {user?.level ? (
                  <span>{getLevelLabel(user.level)}</span>
                ) : (
                  <span>{t('no_level_selected')}</span>
                )}
              </div>
              <input type="hidden" name="level" value={helpData.level} />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-gray-700 font-semibold text-sm mb-1">{t('describe_problem')}</label>
            <textarea
              name="message"
              value={helpData.message}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-gray-700 placeholder-gray-400"
              placeholder={t('explain_problem')}
              required
            />
          </div>

          <div className="mb-8">
            <label className="block text-gray-700 font-semibold text-sm mb-1">{t('upload_homework')}</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center transition-all duration-200 hover:border-indigo-400 hover:bg-indigo-50">
              <div className="flex flex-col items-center justify-center mb-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl text-indigo-600">📁</span>
                </div>
                <p className="text-gray-600 text-sm">{t('drag_drop_or_click')}</p>
              </div>
              <Widget
                publicKey={uploadcarePublicKey}
                multiple={false}
                tabs="file url"
                onFileSelect={(file) => {
                  if (!file) {
                    setHelpData(prev => ({ ...prev, fileUrl: '' }));
                    return;
                  }
                  
                  setUploading(true);
                  setUploadProgress(0);
                  
                  // Track widget progress
                  file.progress((info) => {
                    const pct = Math.round((info.progress || 0) * 100);
                    setUploadProgress(pct);
                  });
                  
                  file.done((fileInfo) => {
                    const cdnUrl = fileInfo?.cdnUrl || (fileInfo?.cdnUrl && fileInfo?.cdnUrlModifiers ? `${fileInfo.cdnUrl}${fileInfo.cdnUrlModifiers}` : '') || fileInfo?.originalUrl;
                    setHelpData(prev => ({ ...prev, fileUrl: cdnUrl || '' }));
                    setUploading(false);
                    setUploadProgress(100);
                  });
                  
                  file.fail((error) => {
                    console.error('Uploadcare upload failed:', error);
                    setUploading(false);
                    setUploadProgress(0);
                    setError(t('file_upload_failed'));
                  });
                }}
              />
            </div>
            
            {uploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">{t('uploading')}... {uploadProgress}%</p>
              </div>
            )}
            
            {helpData.fileUrl && !uploading && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center">
                <span className="text-green-500 text-xl mr-2">✓</span>
                <p className="text-sm text-green-700">
                  {t('file_uploaded')}
                </p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 mb-8">
            <h3 className="font-bold text-indigo-800 text-lg mb-3 flex items-center">
              <span className="text-2xl mr-2">💡</span> {t('how_it_works')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg text-center shadow-sm">
                <div className="text-2xl mb-1">📤</div>
                <p className="text-xs text-gray-600">{t('teachers_classmates_view')}</p>
              </div>
              <div className="bg-white p-3 rounded-lg text-center shadow-sm">
                <div className="text-2xl mb-1">💬</div>
                <p className="text-xs text-gray-600">{t('get_feedback')}</p>
              </div>
              <div className="bg-white p-3 rounded-lg text-center shadow-sm">
                <div className="text-2xl mb-1">🔒</div>
                <p className="text-xs text-gray-600">{t('work_private')}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={() => navigate('/homework')}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 text-sm"
              disabled={loading || uploading}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 text-sm flex items-center justify-center"
            >
              {loading || uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('submitting')}
                </>
              ) : (
                <>
                  <span className="mr-2">📤</span>
                  {t('submit')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <BottomNavbar />
    </div>
  );
};

export default HomeworkHelpStudent;