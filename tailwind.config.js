/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Font Strategy (P3.2.3):
      // Using Tailwind's default system font stack for optimal performance:
      // - Zero network requests (no font files to download)
      // - Zero bytes added to page weight
      // - Instant text rendering (no FOUT/FOIT)
      // - Native look and feel on each platform
      // - Best Core Web Vitals (FCP, LCP)
      //
      // Default stack: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
      //                "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
      //
      // If custom fonts are needed in the future, follow these best practices:
      // 1. Use font-display: swap to prevent FOIT
      // 2. Preload critical fonts in index.html: <link rel="preload" as="font">
      // 3. Use variable fonts to reduce file count
      // 4. Subset fonts to only include needed characters/weights
      // 5. Self-host fonts (don't use Google Fonts CDN) for better privacy and performance
      // 6. Add fallback fonts that match metrics to prevent layout shift
      //
      // Example (if adding custom fonts):
      // fontFamily: {
      //   sans: ['InterVariable', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      // },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
