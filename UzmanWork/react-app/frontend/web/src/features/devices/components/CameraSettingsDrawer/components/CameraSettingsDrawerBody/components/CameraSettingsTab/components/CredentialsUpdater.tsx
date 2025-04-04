import { Stack } from "@mui/material";
import { CameraResponse, DevicesService, isDefined } from "coram-common-utils";
import { useState } from "react";
import { CredentialUpdaterField } from "./CredentialUpdaterField";

// Components to update the camera credentials
export function CredentialsUpdater({
  camera,
  refetch,
}: {
  camera: CameraResponse;
  refetch: () => void;
}) {
  const hasUsername = isDefined(camera.camera.username);
  const hasPassword = isDefined(camera.camera.password);

  const [username, setUsername] = useState(camera.camera.username ?? "");
  const [password, setPassword] = useState(camera.camera.password ?? "");

  const handleUsernameClick = async (shouldSet: boolean) => {
    const newUsername = shouldSet && username !== "" ? username : undefined;
    try {
      await DevicesService.updateCameraCredentials({
        mac_address: camera.camera.mac_address,
        username: newUsername,
        should_update_username: true,
        should_update_password: false,
      });
      refetch();
      setUsername(newUsername ?? "");
    } catch (e) {
      console.error(e);
    }
  };

  const handlePasswordClick = async (shouldSet: boolean) => {
    const newPassword = shouldSet && password !== "" ? password : undefined;
    try {
      await DevicesService.updateCameraCredentials({
        mac_address: camera.camera.mac_address,
        password: newPassword,
        should_update_username: false,
        should_update_password: true,
      });
      refetch();
      setPassword(newPassword ?? "");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Stack gap={7.5}>
      <Stack gap={2}>
        <CredentialUpdaterField
          name="Username"
          textFieldProps={{
            value: username,
            onChange: (e) => setUsername(e.target.value),
          }}
          hasValue={hasUsername}
          onButtonClick={handleUsernameClick}
        />
        <CredentialUpdaterField
          name="Password"
          textFieldProps={{
            value: password,
            onChange: (e) => setPassword(e.target.value),
          }}
          hasValue={hasPassword}
          onButtonClick={handlePasswordClick}
        />
      </Stack>
    </Stack>
  );
}
