export function BusinessDataIcon({
  color = "black",
  size = 24,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <svg
      width={size * (16 / 24)}
      height={size * (20 / 24)}
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 6H6V4H10V6ZM16 2V18C16 19.11 15.11 20 14 20H2C0.89 20 0 19.11 0 18V2C0 1.46957 0.210714 0.960859 0.585786 0.585786C0.960859 0.210714 1.46957 0 2 0H14C14.5304 0 15.0391 0.210714 15.4142 0.585786C15.7893 0.960859 16 1.46957 16 2ZM14 11H2V18H14V11ZM14 2H2V9H14V2ZM10 13H6V15H10V13Z"
        fill={color}
      />
    </svg>
  );
}