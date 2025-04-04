import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from "@mui/icons-material";
import {
  Box,
  Divider,
  FormControlLabel,
  Popover,
  Radio,
  RadioGroup,
  Stack,
  Typography,
  styled,
} from "@mui/material";
import type { TypographyProps } from "@mui/material/Typography";
import type { SxProps } from "@mui/system";
import { UserRole, isDefined } from "coram-common-utils";
import React from "react";
import { RemoveMemberButton } from "./RemoveMemberButton";

const AVAILABLE_ROLES = [
  { value: UserRole.ADMIN, label: "Admin" },
  { value: UserRole.REGULAR, label: "Regular" },
  { value: UserRole.LIMITED, label: "Limited" },
  { value: UserRole.LIVE_ONLY, label: "Live Only" },
];

interface RoleSelectorProps {
  initialRole: UserRole;
  onRoleChange: (value: UserRole) => void;
  removeMember?: () => Promise<void>;
  selectorProps?: TypographyProps;
  sx?: SxProps;
  disabled?: boolean;
}

export const CustomRoleSelector = styled(Stack)(({ theme }) => ({
  minWidth: 100,
  color: theme.palette.neutral?.[400],
  height: "2rem",
  display: "flex",
  justifyContent: "space-between",
  borderRadius: "0.2rem",
  paddingX: "0.7rem",
}));

export function RoleSelector({
  initialRole,
  onRoleChange,
  removeMember,
  selectorProps,
  sx,
  disabled = false,
}: RoleSelectorProps) {
  const [role, setRole] = React.useState(initialRole);
  const [isRoleError, setIsRoleError] = React.useState(false);

  const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | null>(null);
  const isOpen = Boolean(anchorEl);

  const handleUpdateAccess = async (value: UserRole) => {
    const old_value = role;
    setRole(value);
    try {
      onRoleChange(value);
    } catch (error) {
      console.error(error);
      setIsRoleError(true);
      setTimeout(() => setIsRoleError(false), 4000);
      setRole(old_value);
    }
  };

  return (
    <>
      <CustomRoleSelector
        direction="row"
        alignItems="center"
        border={1}
        borderColor="#DFE0E6"
        p={2}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        data-testid="role-selector"
        sx={{ cursor: disabled ? "auto" : "pointer", ...sx }}
      >
        <Typography variant="body2" {...selectorProps}>
          {AVAILABLE_ROLES.find((option) => option.value === role)?.label}
        </Typography>
        {!disabled && isOpen ? (
          <KeyboardArrowUpIcon />
        ) : (
          <KeyboardArrowDownIcon />
        )}
      </CustomRoleSelector>
      <Popover
        open={!disabled && isOpen}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{ sx: { mt: 1 } }}
      >
        <Box p={2}>
          <RadioGroup
            aria-labelledby="demo-radio-buttons-group-label"
            defaultValue={UserRole.REGULAR}
            name="radio-buttons-group"
            value={role}
            onChange={(e) => handleUpdateAccess(e.target.value as UserRole)}
            aria-disabled={isRoleError}
          >
            {AVAILABLE_ROLES.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio color="secondary" size="small" />}
                label={<Typography variant="body2">{option.label}</Typography>}
              />
            ))}
          </RadioGroup>
        </Box>
        {isDefined(removeMember) && (
          <>
            <Divider
              sx={{ width: "80%", border: "1px dashed", color: "neutral.A100" }}
              variant="middle"
            />
            <RemoveMemberButton
              deleteMember={removeMember}
              onSuccessfulDelete={() => setAnchorEl(null)}
              sx={{ justifyContent: "start", p: "1rem" }}
            />
          </>
        )}
      </Popover>
    </>
  );
}
