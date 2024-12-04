module.exports = {
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: "all",
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
  plugins: [
    // https://github.com/prettier/prettier-vscode/issues/2259#issuecomment-952950119
    require.resolve("prettier-plugin-organize-attributes"),
  ],
  attributeGroups: [
    // prettier-plugin-organize-attribute
    "$ANGULAR_STRUCTURAL_DIRECTIVE",
    "$ANGULAR_ELEMENT_REF",
    "$ID",
    "$CLASS",
    "$DEFAULT",
    "$ANGULAR_ANIMATION",
    "$ANGULAR_ANIMATION_INPUT",
    "$ANGULAR_INPUT",
    "$ANGULAR_TWO_WAY_BINDING",
    "$ANGULAR_OUTPUT",
  ],
  overrides: [
    {
      files: ["*.scss", "*.css"],
      options: {
        singleQuote: false,
      },
    },
  ],
};
