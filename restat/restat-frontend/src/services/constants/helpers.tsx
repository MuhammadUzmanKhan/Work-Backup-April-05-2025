import { Tooltip } from "antd";


// Define color mappings for statuses
const statusColorMap: Record<string, string> = {
  Lead: "#1890FF",
  Proposal: "#FFD118",
  Contract: "#03B65C",
};

// Map input statuses to desired statuses
const statusMap: Record<string, string> = {
  Active: "Lead",
  Pending: "Proposal",
  Completed: "Contract",
};

// Utility function to style table titles
export const renderTableTitle = (title: string) => (
  <span
    style={{
      color: "#000000D9",
      fontSize: "14px",
      fontWeight: 700,
    }}
  >
    {title}
  </span>
);

export const renderTableStyledSpan = (value: string | React.ReactNode) => (
  <span
    style={{
      color: "#0794EC",
      fontWeight: 400,
      fontSize: "14px",
      display: "inline-block",
      maxWidth: "100%",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    }}
    title={typeof value === "string" ? value : undefined}
  >
    {value ?? "--"}
  </span>
);

export const renderTableSpan = (value: string | React.ReactNode) => (
  <span
    style={{
      color: "#000000",
      fontWeight: 400,
      fontSize: "14px",
    }}
  >
    {value ?? '--'}
  </span>
);

export const renderStatusWithDot = (status: string) => {
  const mappedStatus = statusMap[status] || "Unknown";
  const color = statusColorMap[mappedStatus] || "gray";

  return (
    <Tooltip title={mappedStatus || "Unknown"}>
      <span style={{ display: "flex", alignItems: "center", justifyContent: "start", gap: "0.5rem" }}>
        <span
          style={{
            minWidth: '0.5rem',
            height: "0.5rem",
            backgroundColor: color,
            borderRadius: "50%",
            display: "inline-block",
          }}
        ></span>
        {mappedStatus}
      </span>
    </Tooltip>
  );
};