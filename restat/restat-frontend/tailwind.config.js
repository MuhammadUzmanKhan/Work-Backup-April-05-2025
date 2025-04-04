/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        secondary: 'var(--secondary-color) !important',
        tertiary: 'var(--tertiary-color)',
        'off-white': 'var(--off-white)',
        blue: 'var(--blue)',
        'sky-blue': 'var(--blue-sky)',
        'blue-opacity-50': 'var(--blue-opacity-50)',
        'blue-shadow': 'var(--blue-shadow)',
        'blue-shadow-dark': 'var(--blue-shadow-dark)',
        white2: 'var(--white2)',
        'blue-border': 'var(--blue-border)',
        'red-color': 'var(--red-color)',
        'green-color': 'var(--green-color)',
        danger: '#FF4D4F',
        warning: '#FAAD14',
        disabled: '#00000040',
        mark: '#000000',
        bodyText: '#000000D9',
        footnoteText: '#00000073',
      },
      fontSize: {
        h1: ['var(--font-size-h1)', { lineHeight: 'var(--font-size-h1)', fontWeight: 'var(--font-weight-medium)' }],
        h2: ['var(--font-size-h2)', { lineHeight: 'var(--line-height-tight)', fontWeight: 'var(--font-weight-medium)' }],
        h3: ['var(--font-size-h3)', { lineHeight: 'var(--line-height-tight)', fontWeight: 'var(--font-weight-medium)' }],
        h4: ['var(--font-size-h4)', { lineHeight: 'var(--line-height-tight)', fontWeight: 'var(--font-weight-medium)' }],
        h5: ['var(--font-size-h5)', { lineHeight: 'var(--line-height-tight)', fontWeight: 'var(--font-weight-medium)' }],
        h6: ['var(--font-size-h6)', { lineHeight: 'var(--line-height-tight)', fontWeight: 'var(--font-weight-medium)' }],
        bodyRegular: ['var(--font-size-body-regular)', { lineHeight: 'var(--line-height-normal)', fontWeight: 'var(--font-weight-regular)' }],
        bodyMedium: ['var(--font-size-body-medium)', { lineHeight: 'var(--line-height-normal)', fontWeight: 'var(--font-weight-medium)' }],
        bodyStrong: ['var(--font-size-body-medium)', { lineHeight: 'var(--line-height-normal)', fontWeight: 'var(--font-weight-bold)' }],
        bodyUnderline: ['var(--font-size-body-medium)', { lineHeight: 'var(--line-height-normal)', fontWeight: 'var(--font-weight-bold)', textDecoration: 'underline' }],
        bodyStrike: ['var(--font-size-body-medium)', { lineHeight: 'var(--line-height-normal)', fontWeight: 'var(--font-weight-regular)', textDecoration: 'line-through' }],
        footnote: ['var(--font-size-body-regular)', { lineHeight: 'var(--line-height-normal)', fontWeight: 'var(--font-weight-regular)', color: 'var(--footnote-text-color)' }],
      },
      fontFamily: {
        sans: ['var(--font-family)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
