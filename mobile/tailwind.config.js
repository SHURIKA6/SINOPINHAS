/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                // Frutiger Aero Palette
                background: '#0E2A47',
                'aero-blue-dark': '#0047AB',
                'aero-blue-light': '#4DA6FF',
                'aero-accent': '#00C6FF',
                'glass-bg': 'rgba(255, 255, 255, 0.4)',
                'window-bg': 'rgba(0, 50, 150, 0.55)',
                
                // Keep some existing or legacy if needed
                surface: '#F0F8FF', // Light blue surface for Aero feel
                primary: '#4DA6FF',
                secondary: '#00C6FF',
                accent: '#00C6FF',
            },
            borderRadius: {
                'aero': '16px',
                'window': '24px',
            }
        },
    },
    plugins: [],
}
