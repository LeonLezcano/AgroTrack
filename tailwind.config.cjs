/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Segoe UI'", 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ["'Consolas'", "'Liberation Mono'", 'ui-monospace', 'SFMono-Regular', 'monospace']
      }
    }
  },
  plugins: []
};
