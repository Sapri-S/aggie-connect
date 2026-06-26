/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                aggie: {
                    blue:  '#004F9F',
                    gold:  '#F0AA00',
                    dark:  '#002147',
                    light: '#E8F0FB',
                },
            },
            fontFamily: {
                sans:    ['Open Sans',   'ui-sans-serif', 'system-ui'],
                heading: ['Montserrat',  'ui-sans-serif', 'system-ui'],
            },
        },
    },
    plugins: [],
};