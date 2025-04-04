import { Add as AddIcon } from "@mui/icons-material";
import { LoadingButton, type LoadingButtonProps } from "@mui/lab";
import { useNavigate } from "react-router-dom";
import { useCreateDashboard } from "../hooks";
import { PathNames } from "hooks/usePageNavigation";

type CreateDashboardButtonProps = Pick<
  LoadingButtonProps,
  "color" | "variant" | "sx"
>;

export function CreateDashboardButton(props: CreateDashboardButtonProps) {
  const navigate = useNavigate();

  const { mutateAsync: createDashboard, isLoading } = useCreateDashboard({
    onSuccessCb: (newDashboardId) =>
      navigate(`${PathNames.INSIGHTS}/${newDashboardId}`),
  });

  return (
    <LoadingButton
      loading={isLoading}
      variant="contained"
      color="secondary"
      onClick={() => createDashboard()}
      startIcon={<AddIcon />}
      {...props}
    >
      Add Dashboard
    </LoadingButton>
  );
}
