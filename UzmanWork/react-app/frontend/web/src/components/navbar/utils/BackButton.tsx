import { useNavigate } from "react-router-dom";
import { ChevronLeft as ChevronLeftIcon } from "@mui/icons-material";
import { Button } from "@mui/material";

interface BackButtonProps {
  onClick?: () => void;
}

export function BackButton({ onClick }: BackButtonProps) {
  const navigate = useNavigate();
  return (
    <Button
      variant="outlined"
      onClick={() => {
        if (onClick) {
          onClick();
        } else {
          navigate(-1);
        }
      }}
      sx={{
        "&.MuiButtonBase-root": {
          border: 0,
          padding: 0,
          minWidth: "2.3rem",
        },
      }}
    >
      <ChevronLeftIcon
        sx={{
          color: "neutral.1000",
          cursor: "pointer",
        }}
      />
    </Button>
  );
}
