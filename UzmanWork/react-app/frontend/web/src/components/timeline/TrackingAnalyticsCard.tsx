import { Card, CardContent, Typography } from "@mui/material";

interface TrackingAnalyticsCardProps {
  Icon: React.ElementType;
  title: string;
  value: string | number;
}

export function TrackingAnalyticsCard({
  Icon,
  title,
  value,
}: TrackingAnalyticsCardProps) {
  return (
    <Card sx={{ border: "1px solid #E5E5E5" }}>
      <CardContent>
        <Icon sx={{ fontSize: 40, color: "#9795FF" }} />
        <Typography variant="body1">{title}</Typography>
        <Typography variant="body1">{value}</Typography>
      </CardContent>
    </Card>
  );
}
