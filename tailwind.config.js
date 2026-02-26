/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                primary: {
                    50: '#effaf4',
                    100: '#d8f3e4',
                    200: '#b4e6cc',
                    300: '#82d2ae',
                    400: '#4db88d',
                    500: '#2a9d70',
                    600: '#1A6B4A',
                    700: '#165a3e',
                    800: '#134833',
                    900: '#103b2a',
                },
                cream: {
                    50: '#fdfcfa',
                    100: '#f8f5f0',
                    200: '#f0ebe1',
                },
                neutral: {
                    850: '#1e1e2e',
                }
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
            },
            boxShadow: {
                'card': '0 2px 16px rgba(0,0,0,0.06)',
                'modal': '0 20px 60px rgba(0,0,0,0.15)',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.25s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(16px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
}
