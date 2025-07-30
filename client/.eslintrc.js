module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-console': 'warn',
    'react-hooks/exhaustive-deps': 'warn'
  },
  env: {
    production: {
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'no-console': 'off',
        'react-hooks/exhaustive-deps': 'off'
      }
    }
  }
}; 