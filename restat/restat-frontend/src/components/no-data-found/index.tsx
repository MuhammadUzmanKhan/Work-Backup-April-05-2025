import { NoDataFoundIcon } from "../../common/icons/no-data-icon";
import { Typography } from "antd";

interface NoDataFoundProps {
  primaryText?: string;
  secondaryText?: string;
}

const NoDataFound: React.FC<NoDataFoundProps> = ({
  primaryText = false,
  secondaryText,
}) => {

  return (
    <div
      className="flex items-center justify-center w-full"
      style={{
        minHeight: "calc(100vh - 100px)",
      }}
    >
      <div className="flex flex-col items-center justify-center rounded-lg w-72 fixed ">
        <NoDataFoundIcon />

        <Typography.Title
          style={{
            fontSize: "20px",
            fontWeight: 500,
            paddingTop: "8px",
            color: "#141414",
            textAlign: "center",
          }}
        >
          {primaryText}
        </Typography.Title>

        <Typography.Text
          style={{
            fontSize: "14px",
            fontWeight: 400,
            color: "#141414",
            textAlign: "center",
          }}
        >
          {secondaryText}
        </Typography.Text>
      </div>
    </div>
  );
};

export default NoDataFound;
