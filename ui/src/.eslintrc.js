module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        "airbnb-base",
    ],
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
    rules: {
        "import/extensions": ["error", "ignorePackages"],
        "no-continue": "off",
        "no-plusplus": "off",
        "no-restricted-syntax": "off",
        "no-param-reassign": "off",
        "lines-between-class-members": ["error", "always", { exceptAfterSingleLine: true }],
        semi: ["error", "always"],
        quotes: ["error", "double"],
        indent: ["error", 4],
    },
};
