/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "toss-blue": "#3182f6",
        "toss-blue-light": "#4593fc",
        "toss-blue-dark": "#1b64da",
        "toss-gray": "#191f28",
        "toss-gray-light": "#8b95a1",
        "toss-gray-lighter": "#f2f4f6",
        "toss-border": "#e5e8eb",
      },
      fontFamily: {
        toss: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Apple SD Gothic Neo",
          "Pretendard",
          "Roboto",
          "Noto Sans KR",
          "Segoe UI",
          "Malgun Gothic",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "sans-serif",
        ],
      },
      spacing: {
        4.5: "1.125rem",
        5.5: "1.375rem",
      },
      borderRadius: {
        toss: "12px",
        "toss-sm": "8px",
      },
      boxShadow: {
        toss: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        "toss-md":
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "toss-lg":
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
