module.exports = {
    env: {
        browser: false,
        commonjs: true,
        es2021: true,
    },
    extends: [
        "airbnb-base",
    ],
    parserOptions: {
        ecmaVersion: "latest",
    },
    rules: {
        "no-restricted-syntax": "off",
        "no-use-before-define": "off",
        "no-console": "off",
        "no-continue": "off",
        "no-param-reassign": "off",
        "no-plusplus": "off",
        "lines-between-class-members": ["error", "always", { exceptAfterSingleLine: true }],
        "import/extensions": ["error", "ignorePackages"],
        semi: ["error", "always"],
        quotes: ["error", "double"],
        indent: ["error", 4],
    },
};
