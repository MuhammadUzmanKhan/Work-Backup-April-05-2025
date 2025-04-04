import { Button, Menu, Stack, Typography } from "@mui/material";
import { CandidateCredentials } from "../../types";
import { useRef, useState } from "react";
import { StyledDropdownMenu } from "components/styled_components/StyledDropdownMenu";
import { StyledUsernameTextField } from "components/styled_components/StyledUsernameTextField";
import { StyledPasswordTextField } from "components/styled_components/StyledPasswordTextField";
import { useIsMobile } from "components/layout/MobileOnly";

interface RegistrationDetailsProps {
  numCandidates: number;
  defaultCredentials: CandidateCredentials;
  onSubmit: (credentials: CandidateCredentials) => void;
}

export function RegistrationDetails({
  numCandidates,
  defaultCredentials,
  onSubmit: onSubmit,
}: RegistrationDetailsProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [localCredentials, setLocalCredentials] =
    useState<CandidateCredentials>({ ...defaultCredentials });
  const isMobile = useIsMobile();

  return (
    <Stack
      direction="row"
      width="100%"
      justifyContent="space-between"
      alignItems="center"
    >
      <Typography variant="body2">{numCandidates} cameras found</Typography>

      <Stack direction="row" gap={1} alignItems="center">
        <Typography variant="body2" maxWidth={isMobile ? "134px" : "auto"}>
          Default Credentials for selected cameras
        </Typography>
        <StyledDropdownMenu
          ref={anchorRef}
          text="Set"
          isOpen={open}
          onClick={() => setOpen(true)}
        />
      </Stack>

      <Menu
        anchorEl={anchorRef.current}
        open={open}
        onClose={() => setOpen(false)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Stack
          py={1}
          px={3}
          minWidth="275px"
          gap={1.5}
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === "Tab") {
              // Prevent the menu from handling tab key
              event.stopPropagation();
            }
          }}
        >
          <StyledUsernameTextField
            value={localCredentials.username || ""}
            onChange={(e) =>
              setLocalCredentials({
                ...localCredentials,
                username: e.target.value === "" ? undefined : e.target.value,
              })
            }
          />
          <StyledPasswordTextField
            value={localCredentials.password || ""}
            onChange={(e) =>
              setLocalCredentials({
                ...localCredentials,
                password: e.target.value === "" ? undefined : e.target.value,
              })
            }
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              onSubmit(localCredentials);
              setOpen(false);
            }}
            sx={{ mt: 2 }}
          >
            Save
          </Button>
        </Stack>
      </Menu>
    </Stack>
  );
}
