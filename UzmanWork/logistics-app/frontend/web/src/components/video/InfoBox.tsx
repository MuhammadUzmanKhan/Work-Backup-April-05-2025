import React, { useRef } from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { isDefined } from "coram-common-utils";
import { useElementSizeFromEl } from "hooks/element_size";
import { getVideoCenteredIconDimensions } from "./utils";

interface InfoBoxProps {
  msg?: string;
  icon: React.ReactElement;
  backgroundImage?: string;
}

export function InfoBox({ msg, icon, backgroundImage }: InfoBoxProps) {
  const theme = useTheme();
  const infoBoxRef = useRef<HTMLDivElement>(null);
  const { size } = useElementSizeFromEl(infoBoxRef.current);

  const iconFontSize = getVideoCenteredIconDimensions(size);

  return (
    <Stack
      ref={infoBoxRef}
      justifyContent="center"
      alignItems="center"
      height="100%"
      width="100%"
      position="relative"
    >
      {backgroundImage && (
        <Box
          position="absolute"
          top={0}
          left="50%"
          height="100%"
          maxWidth="100%"
          component="img"
          src={backgroundImage}
          sx={{
            transform: "translate(-50%, 0%)",
            filter: "brightness(0.5)",
          }}
        />
      )}
      <Stack zIndex={2} justifyContent="center" alignItems="center">
        {React.cloneElement(icon as React.ReactElement, {
          sx: {
            ...icon.props.sx,
            fontSize: iconFontSize,
          },
        })}

        {isDefined(msg) && (
          <Typography variant="body1" ml={1} color={theme.palette.common.white}>
            {msg}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
