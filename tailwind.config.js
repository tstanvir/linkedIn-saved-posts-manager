/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        linkedin: "#0A66C2",
        "mt-bg": "#323437",
        "mt-bg-card": "#2c2e31",
        "mt-bg-input": "#25272a",
        "mt-border": "#555555",
        "mt-text": "#d1d0c5",
        "mt-text-dim": "#646669",
        "mt-accent": "#e2b714",
        "mt-accent-hover": "#e6be22",
        "mt-accent-subtle": "#e2b71415",
        "mt-error": "#ca4754",
        "mt-error-hover": "#e05561",
      },
    },
  },
  plugins: [],
};
