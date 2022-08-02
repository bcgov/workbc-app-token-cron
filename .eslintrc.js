const prettierConfig = require("./.prettierrc")

module.exports = {
    extends: ["elmsd"],
    rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "prettier/prettier": ["error", prettierConfig]
    }
}
