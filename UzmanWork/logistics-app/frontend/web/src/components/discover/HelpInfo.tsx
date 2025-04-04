import { Stack, type SxProps, Typography } from "@mui/material";
import { TextBox } from "./TextBox";
import {
  StarOutline as StarOutlineIcon,
  LightbulbOutlined as LightbulbOutlinedIcon,
  WarningAmberOutlined as WarningAmberOutlinedIcon,
} from "@mui/icons-material";

interface InfoSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

function InfoSection({ title, description, icon }: InfoSectionProps) {
  return (
    <Stack alignItems="center" gap={1}>
      {icon}
      <Typography variant="h3">{title}</Typography>
      <TextBox text={description} />
    </Stack>
  );
}

export function HelpInfo({ sx }: { sx?: SxProps }) {
  return (
    <Stack gap="1.8rem" sx={sx}>
      <InfoSection
        title="Examples"
        description="A group of people chatting with each other"
        icon={<StarOutlineIcon fontSize="large" />}
      />
      <InfoSection
        title="Tips"
        description="Reword the search if you don’t like the results"
        icon={<LightbulbOutlinedIcon fontSize="large" />}
      />
      <InfoSection
        title="Limitations"
        description="May occasionally generate incorrect information"
        icon={<WarningAmberOutlinedIcon fontSize="large" />}
      />
    </Stack>
  );
}
