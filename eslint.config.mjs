import react from 'eslint-plugin-react';

export default [
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    plugins: {
      react,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      ...react.configs.recommended.rules,
      'no-console': 'warn',
    },
  },
  {
    ignores: ['node_modules', '.next'],
  },
];
