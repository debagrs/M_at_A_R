import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
       fontFamily: {
         serif: ['Crimson Pro', 'Georgia', 'serif'],
         sans: ['system-ui', '-apple-system', 'sans-serif'],
       },
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
         forest: {
           deep: "hsl(var(--forest-deep))",
           canopy: "hsl(var(--forest-canopy))",
           moss: "hsl(var(--forest-moss))",
           bark: "hsl(var(--forest-bark))",
           shadow: "hsl(var(--forest-shadow))",
           mist: "hsl(var(--forest-mist))",
         },
         decay: {
           fragment: "hsl(var(--decay-fragment))",
           shadow: "hsl(var(--decay-shadow))",
           blur: "hsl(var(--decay-blur))",
         },
         data: {
            deforestation: "hsl(var(--data-deforestation))",
            consumption: "hsl(var(--data-consumption))",
            extraction: "hsl(var(--data-extraction))",
            ocean: "hsl(var(--data-ocean))",
            pollution: "hsl(var(--data-pollution))",
            fishing: "hsl(var(--data-fishing))",
            acidification: "hsl(var(--data-acidification))",
            air: "hsl(var(--data-air))",
            particulates: "hsl(var(--data-particulates))",
            methane: "hsl(var(--data-methane))",
            ozone: "hsl(var(--data-ozone))",
          },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
         "breathe": {
           "0%, 100%": { opacity: "1" },
           "50%": { opacity: "0.85" },
         },
         "drift": {
           "0%, 100%": { transform: "translateY(0) translateX(0)" },
           "25%": { transform: "translateY(-2px) translateX(1px)" },
           "50%": { transform: "translateY(-1px) translateX(-1px)" },
           "75%": { transform: "translateY(1px) translateX(2px)" },
         },
         "fade-in-slow": {
           "0%": { opacity: "0" },
           "100%": { opacity: "1" },
         },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
         "breathe": "breathe 8s cubic-bezier(0.4, 0, 0.2, 1) infinite",
         "drift": "drift 20s cubic-bezier(0.4, 0, 0.2, 1) infinite",
         "fade-in-slow": "fade-in-slow 3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
       },
       transitionDuration: {
         "slow": "3000ms",
         "medium": "1500ms",
         "breath": "8000ms",
       },
       transitionTimingFunction: {
         "organic": "cubic-bezier(0.4, 0, 0.2, 1)",
         "decay": "cubic-bezier(0.7, 0, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
