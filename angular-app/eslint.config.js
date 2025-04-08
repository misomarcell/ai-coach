// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const prettier = require('eslint-plugin-prettier/recommended');


module.exports = tseslint.config(
	{
		ignores: [
			".angular/**",
			"**/*.js",
		],
	},
	{
		files: ["**/*.ts"],
		extends: [
			eslint.configs.recommended,
			tseslint.configs.recommended,
			tseslint.configs.stylistic,
			angular.configs.tsRecommended,
			prettier
		],
		processor: angular.processInlineTemplates,
		rules: {
			"@typescript-eslint/no-explicit-any": 0,
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
					ignoreRestSiblings: true,
				},
			],
			"@angular-eslint/directive-selector": [
				"error",
				{
					type: "attribute",
					prefix: "app",
					style: "camelCase",
				},
			],
			"@angular-eslint/component-selector": [
				"error",
				{
					type: "element",
					prefix: "app",
					style: "kebab-case",
				},
			],
			"prettier/prettier": [
				"error",
				{
					useTabs: true,
					tabWidth: 4,
					printWidth: 140,
					endOfLine: "auto",
					singleQuote: false,
					quoteProps: "consistent",
					semi: true,
					trailingComma: "none",
				},

				{ usePrettierrc: false },
			],
		},
	},
	{
		files: ["**/*.html"],
		extends: [
			...angular.configs.templateRecommended,
			...angular.configs.templateAccessibility,

		],
		rules: {}
	}
);
