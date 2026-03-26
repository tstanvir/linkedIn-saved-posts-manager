/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        linkedin: "#0A66C2",
        "mt-bg": "var(--mt-bg)",
        "mt-bg-card": "var(--mt-bg-card)",
        "mt-bg-input": "var(--mt-bg-input)",
        "mt-border": "var(--mt-border)",
        "mt-text": "var(--mt-text)",
        "mt-text-dim": "var(--mt-text-dim)",
        "mt-accent": "var(--mt-accent)",
        "mt-accent-hover": "var(--mt-accent-hover)",
        "mt-accent-subtle": "var(--mt-accent-subtle)",
        "mt-error": "var(--mt-error)",
        "mt-error-hover": "var(--mt-error-hover)",
      },
    },
  },
  plugins: [],
};
