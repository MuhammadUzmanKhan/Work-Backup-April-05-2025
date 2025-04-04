export const MoreIcon = ({ color = "#83889E" }: { color?: string }) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="10.125"
        cy="10"
        r="8.25"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.125" cy="10" r="1" fill={color} />
      <circle cx="10.125" cy="10" r="1" fill={color} />
      <circle cx="13.125" cy="10" r="1" fill={color} />
    </svg>
  );
};
