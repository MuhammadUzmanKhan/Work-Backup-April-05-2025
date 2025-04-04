import { OrganizationsService, isDefined } from "coram-common-utils";
import { OrgFieldListItem } from "./OrgFieldListItem";
import { useOrgFieldCallback } from "hooks/org_field_update";
import { Box, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useOrgNumberLicensedCameras } from "hooks/org_features";

export function OrgNumberLicensedCamerasListItem() {
  const {
    data: numberLicensedCameras,
    status,
    refetch,
  } = useOrgNumberLicensedCameras();
  const [localNumberLicensedCameras, setLocalNumberLicensedCameras] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (status == "success") {
      setLocalNumberLicensedCameras(numberLicensedCameras);
    }
  }, [numberLicensedCameras, status]);

  const { isLoading, handleInputChange } = useOrgFieldCallback(
    async (numberLicensedCameras: number | null) => {
      await OrganizationsService.updateNumberLicensedCameras({
        number_licensed_cameras: isDefined(numberLicensedCameras)
          ? numberLicensedCameras
          : undefined,
      });
    },
    "Failed to update the number of licensed camera for this org.",
    "The number of licensed cameras has been successfully updated for this org.",
    refetch
  );

  return (
    <OrgFieldListItem
      disabled={
        numberLicensedCameras == localNumberLicensedCameras || isLoading
      }
      primaryText={
        <Typography variant="h2">
          Set the number of licensed cameras for this organization
        </Typography>
      }
      secondaryText={
        "The number of licensed cameras determines the maximum number of cameras that can be registered to this organization."
      }
      Icon={Box}
      confirmProps={{
        confirmText:
          "Are you sure you want to change the number of licensed cameras? This won't affect the number of cameras currently registered to this organization.",
        yesText: "Yes, apply the new setting",
        noText: "No, keep the setting",
      }}
      onButtonClick={async () =>
        await handleInputChange(localNumberLicensedCameras)
      }
      actionComponent={
        <TextField
          value={localNumberLicensedCameras}
          onChange={(event) => {
            if (event.target.value === "") {
              setLocalNumberLicensedCameras(null);
              return;
            }
            setLocalNumberLicensedCameras(parseInt(event.target.value));
          }}
        />
      }
    />
  );
}
