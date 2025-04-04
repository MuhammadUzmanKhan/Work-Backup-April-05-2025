import { CircularProgress } from "@mui/material";
import { CameraResponse } from "coram-common-utils";
import { useCurrentCamera } from "hooks/timeline_page";
import { createElement } from "react";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import { IntParam, withValidatedPathParams } from "common/utils";

interface ChildProps {
  camera: CameraResponse;
}

const RequireCameraFromQueryIDPathParamsSchema = z.object({
  cameraId: IntParam,
});

type RequireCameraFromQueryIDPathParams = z.infer<
  typeof RequireCameraFromQueryIDPathParamsSchema
>;

interface RequireCameraFromQueryIDProps {
  component: (props: ChildProps) => JSX.Element;
}

function RequireCameraFromQueryIDImpl({
  cameraId,
  component,
}: RequireCameraFromQueryIDProps & RequireCameraFromQueryIDPathParams) {
  // Get the current stream based on the URL
  const { data: camera, error: errorFetchingStream } =
    useCurrentCamera(cameraId);
  if (errorFetchingStream) {
    return <Navigate to="/404" replace />;
  }
  return (
    <>
      {camera ? (
        // Note: we need to create the component in a different react fiber
        // Otherwise we are not able to use hooks
        createElement(component, { camera: camera })
      ) : (
        <CircularProgress size="large" />
      )}
    </>
  );
}

export const RequireCameraFromQueryID = withValidatedPathParams<
  RequireCameraFromQueryIDProps,
  RequireCameraFromQueryIDPathParams
>(RequireCameraFromQueryIDImpl, RequireCameraFromQueryIDPathParamsSchema);
