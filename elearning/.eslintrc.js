module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-no-undef': 'error',
    'import/no-anonymous-default-export': 'warn'
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn'
      }
    }
  ]
};