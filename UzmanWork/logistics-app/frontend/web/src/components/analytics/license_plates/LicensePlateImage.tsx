import { LicensePlateResponse } from "coram-common-utils";

interface LicensePlateImageCrops {
  licensePlateData: LicensePlateResponse;
  boxWidth: number;
  boxHeight: number;
  onClick?: () => void;
}

export function LicensePlateImage({
  licensePlateData,
  boxWidth,
  boxHeight,
  onClick,
}: LicensePlateImageCrops) {
  const licensePlate = licensePlateData.license_plate;
  const licensePlateWidth = licensePlate.x_max - licensePlate.x_min;
  const licensePlateHeight = licensePlate.y_max - licensePlate.y_min;
  const scaleX = boxWidth / licensePlateWidth;
  const scaleY = boxHeight / licensePlateHeight;
  return (
    <div
      style={{
        width: `${boxWidth}px`,
        height: `${boxHeight}px`,
        backgroundColor: "black",
        cursor: onClick ? "pointer" : "auto",
      }}
    >
      <img
        src={licensePlateData.s3_signed_url}
        style={{
          width: licensePlateWidth,
          height: licensePlateHeight,
          objectPosition: `-${licensePlate.x_min}px -${licensePlate.y_min}px`,
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: " top left",
          objectFit: "none",
          overflow: "hidden",
        }}
        onClick={onClick}
      />
    </div>
  );
}
