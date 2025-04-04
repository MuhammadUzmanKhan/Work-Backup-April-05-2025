export function PlayIcon({ color = "#ffff" }: { color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.228 19.7576C4.53668 20.1117 3.71524 20.0743 3.05745 19.6588C2.39966 19.2433 1.99947 18.5091 2 17.7187V2.27931C1.99947 1.48894 2.39966 0.754737 3.05745 0.339265C3.71524 -0.0762076 4.53668 -0.113607 5.228 0.240442L16.7669 7.95349C17.5227 8.34008 18 9.12984 18 9.99369C18 10.8575 17.5227 11.6473 16.7669 12.0339L5.228 19.7576Z"
        fill={color}
      />
    </svg>
  );
}
