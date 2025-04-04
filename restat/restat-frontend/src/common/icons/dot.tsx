type DotProps = {
  color: string; // Define the color prop as a string
};

const Dot: React.FC<DotProps> = ({ color }) => (
  <div
    style={{
      width: "8px",
      height: "8px",
      backgroundColor: color,
      borderRadius: "50%",
    }}
  />
);

export default Dot;
