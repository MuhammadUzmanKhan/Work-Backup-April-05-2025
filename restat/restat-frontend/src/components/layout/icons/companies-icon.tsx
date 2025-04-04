
export function CompaniesIcon({
  color = "black",
  size = 24,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 1H3C1.89543 1 1 1.89543 1 3V19C1 20.1046 1.89543 21 3 21H15C16.1046 21 17 20.1046 17 19V3C17 1.89543 16.1046 1 15 1Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 21V17H12V21M5 5H5.01M13 5H13.01M9 5H9.01M9 9H9.01M9 13H9.01M13 9H13.01M13 13H13.01M5 9H5.01M5 13H5.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
