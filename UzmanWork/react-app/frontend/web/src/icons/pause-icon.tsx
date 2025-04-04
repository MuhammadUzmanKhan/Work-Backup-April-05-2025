export function PauseIcon({ color = "#ffff" }: { color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <rect x="12" y="-0.000976562" width="6" height="20" rx="1" fill={color} />
      <rect x="2" y="-0.000976562" width="6" height="20" rx="1" fill={color} />
    </svg>
  );
}
