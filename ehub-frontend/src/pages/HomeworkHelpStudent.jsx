import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeworkApi } from '../api/homeworkApi';
import { Widget } from '@uploadcare/react-widget';
import { useTranslation } from 'react-i18next';
import BottomNavbar from '../components/ui/BottomNavbar';

const HomeworkHelpStudent = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [helpData, setHelpData] = useState({
    homeworkTitle: '',
    subject: '',
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
    if (!helpData.homeworkTitle || !helpData.subject || !helpData.message) {
      setError(t('please_fill_required_fields'));
      setLoading(false);
      return;
    }

    try {
      // Create form data with text fields and file URL
      const formData = {
        homeworkTitle: helpData.homeworkTitle,
        subject: helpData.subject,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3"
          >
            <span className="mr-1">←</span> {t('back')}
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('get_help')}</h1>
          <p className="text-gray-600 text-sm">{t('upload_for_help')}</p>
        </div>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded mb-4 text-sm">
            {t('help_submitted')}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4">
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">{t('title')}</label>
              <input
                type="text"
                name="homeworkTitle"
                value={helpData.homeworkTitle}
                onChange={handleInputChange}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                placeholder={t('e.g._math')}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">{t('subject')}</label>
              <select
                name="subject"
                value={helpData.subject}
                onChange={handleInputChange}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                required
              >
                <option value="">{t('select_subject')}</option>
                <option value="Mathematics">{t('math')}</option>
                <option value="Science">{t('science')}</option>
                <option value="English">{t('english')}</option>
                <option value="History">{t('history')}</option>
                <option value="Art">{t('art')}</option>
                <option value="Other">{t('other')}</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-1">{t('describe_problem')}</label>
            <textarea
              name="message"
              value={helpData.message}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
              placeholder={t('explain_problem')}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-1">{t('upload_homework')}</label>
            <div className="mb-3">
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
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">{t('uploading')}... {uploadProgress}%</p>
              </div>
            )}
            
            {helpData.fileUrl && !uploading && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-xs text-green-700">
                  ✓ {t('file_uploaded')}
                </p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-5">
            <h3 className="font-medium text-blue-800 text-sm mb-1">💡 {t('how_it_works')}</h3>
            <ul className="list-disc list-inside text-blue-700 text-xs space-y-1">
              <li>{t('teachers_classmates_view')}</li>
              <li>{t('get_feedback')}</li>
              <li>{t('work_private')}</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/homework')}
              className="px-4 py-1 border border-gray-300 text-gray-700 rounded text-sm"
              disabled={loading || uploading}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm disabled:opacity-50"
            >
              {loading || uploading ? t('submitting') : t('submit')}
            </button>
          </div>
        </form>
      </div>
      <BottomNavbar />
    </div>
  );
};

export default HomeworkHelpStudent;