/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: "#09090b",
          "primary-foreground": "#fafafa",
          muted: "#f4f4f5",
          "muted-foreground": "#71717a",
          border: "#e4e4e7",
          input: "#e4e4e7",
          ring: "#18181b",
          card: "#ffffff",
          "card-foreground": "#09090b",
          destructive: "#ef4444",
          "destructive-foreground": "#fafafa",
        },
        fontFamily: {
          sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        },
      },
    },
    plugins: [],
  }
