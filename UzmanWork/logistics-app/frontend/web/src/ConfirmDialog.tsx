import { Box, Dialog, Stack, Typography } from "@mui/material";
import type { SimplePaletteColorOptions } from "@mui/material";
import { lightThemeOptions } from "theme/light-theme-options";
import { isDefined } from "coram-common-utils";
import { Close as CloseIcon } from "@mui/icons-material";

export interface ConfirmDialogProps {
  confirmText: string;
  yesText?: string;
  noText?: string;
}
interface ConfirmDialogPropsInner {
  giveAnswer: (answer: boolean) => void;
  outerProps: ConfirmDialogProps;
}

export function ConfirmDialog({
  giveAnswer,
  outerProps,
}: ConfirmDialogPropsInner) {
  const secondary = lightThemeOptions.palette?.secondary;
  const backgroundColor = isDefined(secondary)
    ? (secondary as SimplePaletteColorOptions).main
    : "";

  return (
    <Dialog open={true} onClose={() => giveAnswer(false)}>
      <CloseIcon
        sx={{
          position: "absolute",
          top: "8px",
          right: "8px",
          cursor: "pointer",
        }}
        onClick={() => giveAnswer(false)}
      />
      <Stack justifyContent="center" textAlign="center" p={5} gap={3}>
        <Typography
          fontSize="1.25rem"
          fontFamily='"Rubik", "Inter","sans-serif"'
        >
          Are you sure?
        </Typography>
        <Typography variant="body1" maxWidth="450px" alignSelf="center">
          {outerProps.confirmText}
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Box
            p="8px 20px"
            border="1px solid black"
            borderRadius="4px"
            minWidth="150px"
            textAlign="center"
            sx={{
              cursor: "pointer",
            }}
            onClick={() => giveAnswer(true)}
          >
            <Typography variant="body1">{outerProps.yesText}</Typography>
          </Box>
          <Box
            p="8px 20px"
            borderRadius="4px"
            minWidth="150px"
            textAlign="center"
            bgcolor={backgroundColor}
            color="white"
            sx={{
              cursor: "pointer",
            }}
            onClick={() => giveAnswer(false)}
          >
            <Typography variant="body1">{outerProps.noText}</Typography>
          </Box>
        </Stack>
      </Stack>
    </Dialog>
  );
}
