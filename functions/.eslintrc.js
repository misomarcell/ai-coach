module.exports = {
	root: true,
	env: {
		es6: true,
		node: true
	},
	extends: [
		"eslint:recommended",
		"plugin:import/errors",
		"plugin:import/warnings",
		"plugin:import/typescript",
		"google",
		"plugin:@typescript-eslint/recommended"
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: ["tsconfig.json", "tsconfig.dev.json"],
		tsconfigRootDir: __dirname,
		sourceType: "module"
	},
	ignorePatterns: ["/lib/**/*", "/dist/**/*"],
	plugins: ["@typescript-eslint", "import"],
	rules: {
		"object-curly-spacing": ["error", "always"],
		"quotes": ["error", "double"],
		"quote-props": ["error", "consistent"],
		"no-mixed-spaces-and-tabs": ["warn", "smart-tabs"],
		"indent": ["error", "tab", { "SwitchCase": 1, "ignoredNodes": ["ArrowFunctionExpression", "ConditionalExpression"] }],
		"comma-dangle": ["error", "never"],
		"import/order": "error",
		"@typescript-eslint/no-explicit-any": 0,
		"operator-linebreak": 0,
		"no-case-declarations": 0,
		"import/no-unresolved": 0,
		"require-jsdoc": 0,
		"linebreak-style": 0,
		"valid-jsdoc": 0,
		"new-cap": 0,
		"max-len": 0,
		"no-tabs": 0
	}
};
