import { Dialog, styled } from "@mui/material";
export const StyledDialog = styled(Dialog)({
  "& .MuiDialog-paper": {
    borderRadius: "8px",
    top: "40%",
    position: "absolute",
    left: "50%",
    right: "50%",
    transform: "translate(-50%, -50%)",
  },
});
