module.exports = {
    extends: ['plugin:@next/next/recommended', '@salutejs/eslint-config'],
    ignorePatterns: ['**/@generated/**', '**/dist/**', '**/build/**', '**/.next/**'],
    plugins: ['import', 'prettier'],
    rules: {
        'react/react-in-jsx-scope': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        'no-underscore-dangle': 'off',
    },
};
