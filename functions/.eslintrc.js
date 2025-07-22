module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    sourceType: "module",
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: [
    "lib/**/*", // Ignora i file compilati
    ".eslintrc.js", // Ignora questo file di configurazione
  ],
  plugins: ["@typescript-eslint", "import"],
  rules: {
    // Disattiva la regola sulla lunghezza massima della riga, che può essere troppo restrittiva.
    "max-len": "off",

    // Imposta lo stile dei fine riga su LF (Unix).
    // Questo previene errori quando si lavora su sistemi operativi diversi (es. Windows e macOS/Linux).
    "linebreak-style": ["error", "unix"],

    // La configurazione di Google richiede JSDoc, che può essere fastidioso.
    // Puoi disattivarle se non vuoi scrivere JSDoc per ogni funzione.
    "require-jsdoc": "off",
    "valid-jsdoc": "off",

    // TypeScript gestisce già la validità delle importazioni.
    "import/no-unresolved": 0,
  },
};
