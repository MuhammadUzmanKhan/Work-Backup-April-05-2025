import {
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  styled,
} from "@mui/material";
import { OrgFlagSwitch } from "./OrgFlagSwitch";
import { OrgFlagListItemData } from "utils/organization_flag_items";
import { CollapsableText } from "./CollapsableText";

export const CustomAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.neutral?.["A100"],
  borderRadius: "8px",
  width: "3.5rem",
  height: "3.4rem",
}));

export function OrgFlagListItem({
  flagEnum,
  Icon,
  primaryText,
  secondaryText,
}: OrgFlagListItemData) {
  return (
    <ListItem sx={{ px: 0, py: 1 }} alignItems="flex-start">
      <ListItemAvatar>
        <CustomAvatar sx={{ mr: "1rem" }}>
          <Icon color="action" />
        </CustomAvatar>
      </ListItemAvatar>
      <ListItemText
        primary={<Typography variant="h2">{primaryText}</Typography>}
        secondaryTypographyProps={{ component: "div", pt: 1 }}
        secondary={<CollapsableText text={secondaryText} numWordsLimit={15} />}
      />
      <OrgFlagSwitch flagEnum={flagEnum} />
    </ListItem>
  );
}
