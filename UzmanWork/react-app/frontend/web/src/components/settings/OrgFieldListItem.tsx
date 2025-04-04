import {
  Button,
  Divider,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
} from "@mui/material";
import { confirm } from "utils/confirm";
import { useIsMobile } from "components/layout/MobileOnly";
import { CustomAvatar } from "./OrgFlagListItem";
import { ConfirmDialogProps } from "ConfirmDialog";
import { CollapsableText } from "./CollapsableText";

interface OrgFieldListItemProps {
  primaryText: React.ReactNode | string;
  secondaryText?: string;
  Icon: React.ElementType;
  confirmProps: ConfirmDialogProps;
  disabled: boolean;
  selectWidthDesktop?: string;
  actionComponent: React.ReactNode;
  onButtonClick: () => Promise<void>;
}

export function OrgFieldListItem({
  primaryText,
  secondaryText,
  Icon,
  confirmProps,
  disabled,
  actionComponent,
  onButtonClick,
  selectWidthDesktop = "7.5rem",
}: OrgFieldListItemProps) {
  const isMobile = useIsMobile();

  return (
    <>
      <ListItem sx={{ px: 0, py: 1 }} alignItems="flex-start">
        <ListItemAvatar>
          <CustomAvatar sx={{ mr: "1rem" }}>
            <Icon color="action" />
          </CustomAvatar>
        </ListItemAvatar>
        <ListItemText
          primary={primaryText}
          secondaryTypographyProps={{ component: "div", pt: 1 }}
          secondary={
            <Stack gap={1}>
              {secondaryText && (
                <CollapsableText text={secondaryText} numWordsLimit={20} />
              )}
              <Stack
                direction="row"
                gap={1}
                sx={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "1fr 1fr"
                    : `${selectWidthDesktop} 7.5rem`,
                }}
              >
                {actionComponent}
                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  color="secondary"
                  disabled={disabled}
                  sx={{
                    borderRadius: "0.2rem",
                    minWidth: "6.5rem",
                  }}
                  onClick={async () => {
                    const isConfirmed = await confirm(confirmProps);
                    if (!isConfirmed) {
                      return;
                    }
                    await onButtonClick();
                  }}
                >
                  Update
                </Button>
              </Stack>
            </Stack>
          }
        />
      </ListItem>
      <Divider variant="fullWidth" component="li" />
    </>
  );
}
