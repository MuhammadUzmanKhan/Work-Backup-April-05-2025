// LiveView.tsx
import React from "react";
import { Stack } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { Link } from "react-router-dom";
import { FullScreenButton } from "../components/intercom/FullScreenButton";

export function LiveView() {
  const videoUrls = [
    "https://www.youtube.com/embed/ZBCUegTZF7M?si=8dHrD0iR0VZYqWiV",
    "https://www.youtube.com/embed/ZBCUegTZF7M?si=8dHrD0iR0VZYqWiV",
    "https://www.youtube.com/embed/ZBCUegTZF7M?si=8dHrD0iR0VZYqWiV",
  ];

  const handleFullScreenClick = () => {
    const videoElement = document.getElementById("fullscreen-video");
    if (videoElement) {
      videoElement.requestFullscreen();
    }
  };

  return (
    <Stack pl={10} gap={3}>
      <Grid container spacing={3} pt={8}>
        {videoUrls.map((url, index) => (
          <Grid key={`video-${index}`} md={4}>
            <Link to={`/timeline/${index + 1}`}>
              <iframe
                id="fullscreen-video"
                style={{ borderRadius: "16px" }}
                width="100%"
                height="315"
                src={url}
                title={`Video ${index + 1}`}
                allowFullScreen
              ></iframe>
            </Link>
          </Grid>
        ))}
      </Grid>
      <Stack direction="row" alignItems="start" justifyContent="end">
        <FullScreenButton onClick={handleFullScreenClick} />
      </Stack>
    </Stack>
  );
}
