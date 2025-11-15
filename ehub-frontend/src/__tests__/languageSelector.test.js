import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import LanguageSelector from '../components/ui/LanguageSelector';

// Mock the language options
jest.mock('../utils/languageOptions', () => ({
  languageOptions: [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'rw', label: 'Kinyarwanda' }
  ]
}));

describe('LanguageSelector', () => {
  beforeEach(() => {
    // Reset localStorage before each test
    localStorage.clear();
  });

  test('renders language selector with default language', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSelector />
      </I18nextProvider>
    );

    // Should show the current language (default is 'rw')
    expect(screen.getByText('Kinyarwanda')).toBeInTheDocument();
  });

  test('changes language when option is selected', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSelector />
      </I18nextProvider>
    );

    // Open the dropdown
    const button = screen.getByLabelText('Select language');
    fireEvent.click(button);

    // Select English
    const englishOption = screen.getByText('English');
    fireEvent.click(englishOption);

    // Check if language changed
    expect(i18n.language).toBe('en');
  });

  test('saves language preference to localStorage', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSelector />
      </I18nextProvider>
    );

    // Open the dropdown
    const button = screen.getByLabelText('Select language');
    fireEvent.click(button);

    // Select French
    const frenchOption = screen.getByText('Français');
    fireEvent.click(frenchOption);

    // Check if language is saved to localStorage
    expect(localStorage.getItem('preferred-language')).toBe('fr');
  });
});