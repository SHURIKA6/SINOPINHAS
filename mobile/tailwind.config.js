/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                background: '#0f0d15',
                surface: '#1a1a1a',
                primary: '#3b82f6',
                secondary: '#a855f7',
                accent: '#f43f5e',
            }
        },
    },
    plugins: [],
}
