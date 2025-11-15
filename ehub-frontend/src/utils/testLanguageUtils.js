// Utility functions for testing language functionality

export const testLanguageChange = (i18n, newLanguage) => {
  try {
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('preferred-language', newLanguage);
    console.log(`Language changed to: ${newLanguage}`);
    return true;
  } catch (error) {
    console.error('Error changing language:', error);
    return false;
  }
};

export const getCurrentLanguage = (i18n) => {
  return i18n.language;
};

export const getSavedLanguage = () => {
  return localStorage.getItem('preferred-language');
};

export const clearLanguagePreference = () => {
  localStorage.removeItem('preferred-language');
  console.log('Language preference cleared');
};

// Test if all languages are working
export const testAllLanguages = (i18n) => {
  const languages = ['en', 'fr', 'rw'];
  const results = {};
  
  languages.forEach(lang => {
    try {
      i18n.changeLanguage(lang);
      const dashboardText = i18n.t('dashboard');
      results[lang] = {
        success: true,
        translation: dashboardText
      };
    } catch (error) {
      results[lang] = {
        success: false,
        error: error.message
      };
    }
  });
  
  // Reset to original language
  const originalLang = localStorage.getItem('preferred-language') || 'rw';
  i18n.changeLanguage(originalLang);
  
  return results;
};