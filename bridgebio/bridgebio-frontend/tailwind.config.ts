import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: "#000066",
                secondary: "#0E2A5B",
                ternary: "#B6C5E0",
                lightBlue: "#DBDBF8",
                light: "#dae4ee",
                white: "#ffffff",
                dark: "#0e111b",
                info: "#df99fb",
                success: "#11a95f",
                warning: "#e6cc11",
                danger: "#f70a06",
                adminSecondary: '#ECECF8',
                adminContainer: '#ECECF6'

            },
            fontFamily: {
                biryani: ['var(--font-biryani']
            }
        }
    },
    plugins: []
};
export default config;
