interface VehicleImageProps {
  src: string | undefined;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function VehicleImage({ src, style, onClick }: VehicleImageProps) {
  return (
    <div
      style={{
        backgroundColor: "black",
        cursor: onClick ? "pointer" : "auto",
        ...style,
      }}
    >
      <img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center",
        }}
        onClick={onClick}
      />
    </div>
  );
}
