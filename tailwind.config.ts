import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7651C8",
          dark: "#4B2C92",
          light: "#9B7BE3",
          soft: "#EDE4FF",
        },
        lavender: {
          bg: "#F3EDFF",
          card: "#FAF7FF",
          border: "#E2D6FA",
        },
        accent: {
          DEFAULT: "#FFC857",
          dark: "#E09F1F",
          soft: "#FFF4D6",
        },
        success: {
          DEFAULT: "#39B98A",
          dark: "#258A65",
          soft: "#E2F7EF",
        },
        ink: {
          DEFAULT: "#231942",
          muted: "#5A4E7A",
          subtle: "#7B6E9E",
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', '"Nunito"', '"Helvetica Neue"', "Arial", "system-ui", "-apple-system", "sans-serif"],
        display: ['"Trebuchet MS"', '"Segoe UI"', '"Nunito"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 10px 30px -10px rgba(75, 44, 146, 0.14)",
        card: "0 6px 20px -6px rgba(75, 44, 146, 0.12)",
        button: "0 6px 0 0 #4B2C92",
        "button-accent": "0 5px 0 0 #D69416",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pop: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        float: "float 3.5s ease-in-out infinite",
        pop: "pop 0.22s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
