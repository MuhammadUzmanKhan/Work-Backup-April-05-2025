import {
  Autocomplete,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useState } from "react";
import { TextBox } from "../components/TextBox";

export function InsertionFormPage() {
  const [projectName, setProjectName] = useState("");
  const [behanceLink, setBehanceLink] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [liveLink, setLiveLink] = useState("");
  const [figmaLink, setFigmaLink] = useState("");
  const [googleDriveLink, setGoogleDriveLink] = useState("");
  const [defectReportLink, setDefectReportLink] = useState("");
  const [audioReportLink, setAudioReportLink] = useState("");

  const [text, setText] = useState("");
  const handleTextChange = (newText: string) => {
    setText(newText);
  };
  const options = [
    { value: "MERN", label: "Mern" },
    { value: "MEAN", label: "Mean" },
    { value: "PHP", label: "Php" },
    { value: "C#", label: "C#" },
  ];

  return (
    <>
      <Typography variant="body1" pl={4}>
        Insertion Form
      </Typography>
      <Grid container>
        <Grid
          xs={8}
          p={2}
          sx={{
            overflowY: "auto",
          }}
        >
          <Stack direction="row">
            <Stack width="50%" gap={2} p={2}>
              <Typography>Project Name</Typography>
              <TextField
                placeholder="Enter Project Name"
                value={projectName}
                multiline
                maxRows={5}
                onChange={(ev) => setProjectName(ev.target.value)}
                InputProps={{
                  sx: {
                    fontSize: "12px",
                    borderRadius: "8px",
                    color: "common.white",
                    borderColor: "white",
                    borderWidth: "1px",
                    py: "10px",
                    borderStyle: "solid",
                  },
                }}
              />
            </Stack>
            <Stack width="50%" gap={2} p={2}>
              <Typography>Behance Link</Typography>
              <TextField
                placeholder="Enter Behance Link"
                value={behanceLink}
                multiline
                maxRows={5}
                onChange={(ev) => setBehanceLink(ev.target.value)}
                InputProps={{
                  sx: {
                    fontSize: "12px",
                    borderRadius: "8px",
                    color: "common.white",
                    borderColor: "white",
                    borderWidth: "1px",
                    py: "10px",
                    borderStyle: "solid",
                  },
                }}
              />
            </Stack>
          </Stack>
          <Stack direction="row">
            <Stack width="50%" gap={0.2} p={2}>
              <Typography>Tech Stack</Typography>
              <Autocomplete
                multiple
                limitTags={2}
                id="multiple-limit-tags"
                options={options}
                getOptionLabel={(option) => option.value}
                defaultValue={[options[0], options[1]]}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Tech Stack" />
                )}
                ChipProps={{
                  sx: { color: "white", backgroundColor: "grey" },
                }}
                sx={{ width: "100%", maxHeight: "20px" }}
              />
            </Stack>
            <Stack width="50%" gap={2} p={2}>
              <Typography>Github Link</Typography>
              <TextField
                placeholder="Enter Github Link"
                value={githubLink}
                multiline
                maxRows={5}
                onChange={(ev) => setGithubLink(ev.target.value)}
                InputProps={{
                  sx: {
                    fontSize: "12px",
                    borderRadius: "8px",
                    color: "common.white",
                    borderColor: "white",
                    borderWidth: "1px",
                    py: "10px",
                    borderStyle: "solid",
                  },
                }}
              />
            </Stack>
          </Stack>
          <Stack direction="row">
            <Stack width="50%" gap={0.2} p={2}>
              <Typography>Frameworks</Typography>
              <Autocomplete
                multiple
                limitTags={2}
                id="multiple-limit-tags"
                options={options}
                getOptionLabel={(option) => option.value}
                defaultValue={[options[0], options[1]]}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Framework" />
                )}
                ChipProps={{
                  sx: { color: "white", backgroundColor: "grey" },
                }}
                sx={{ width: "100%", maxHeight: "20px" }}
              />
            </Stack>
            <Stack width="50%" gap={2} p={2}>
              <Typography>Live Link</Typography>
              <TextField
                placeholder="Enter Live Link"
                value={liveLink}
                multiline
                maxRows={5}
                onChange={(ev) => setLiveLink(ev.target.value)}
                InputProps={{
                  sx: {
                    fontSize: "12px",
                    borderRadius: "8px",
                    color: "common.white",
                    borderColor: "white",
                    borderWidth: "1px",
                    py: "10px",
                    borderStyle: "solid",
                  },
                }}
              />
            </Stack>
          </Stack>
          <Stack direction="row">
            <Stack width="50%" gap={0.2} p={2}>
              <Typography>Libraries</Typography>
              <Autocomplete
                multiple
                limitTags={2}
                id="multiple-limit-tags"
                options={options}
                getOptionLabel={(option) => option.value}
                defaultValue={[options[0], options[1]]}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Libraries" />
                )}
                sx={{ width: "100%", maxHeight: "20px !important" }}
                ChipProps={{
                  sx: { color: "white", backgroundColor: "grey" },
                }}
              />
            </Stack>
            <Stack width="50%" gap={2} p={2}>
              <Typography>Figma Link</Typography>
              <TextField
                placeholder="Enter Figma Link"
                value={figmaLink}
                multiline
                maxRows={5}
                onChange={(ev) => setFigmaLink(ev.target.value)}
                InputProps={{
                  sx: {
                    fontSize: "12px",
                    borderRadius: "8px",
                    color: "common.white",
                    borderColor: "white",
                    borderWidth: "1px",
                    py: "10px",
                    borderStyle: "solid",
                  },
                }}
              />
            </Stack>
          </Stack>
          <Stack direction="row">
            <Stack width="50%" gap={0.2} p={2}>
              <Typography>Tags</Typography>
              <Autocomplete
                multiple
                limitTags={2}
                id="multiple-limit-tags"
                options={options}
                getOptionLabel={(option) => option.value}
                defaultValue={[options[0], options[1]]}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Tags" />
                )}
                ChipProps={{
                  sx: { color: "white", backgroundColor: "grey" },
                }}
                sx={{ width: "100%", maxHeight: "20px" }}
              />
            </Stack>
            <Stack width="50%" gap={2} p={2}>
              <Typography>Google Drive Link</Typography>
              <TextField
                placeholder="Enter Google Drive Link"
                value={googleDriveLink}
                multiline
                maxRows={5}
                onChange={(ev) => setGoogleDriveLink(ev.target.value)}
                InputProps={{
                  sx: {
                    fontSize: "12px",
                    borderRadius: "8px",
                    color: "common.white",
                    borderColor: "white",
                    borderWidth: "1px",
                    py: "10px",
                    borderStyle: "solid",
                  },
                }}
              />
            </Stack>
          </Stack>
          <Stack direction="row">
            <Stack width="50%" gap={0.2} p={2}>
              <Typography>Start Time</Typography>
              <Autocomplete
                multiple
                limitTags={2}
                id="multiple-limit-tags"
                options={options}
                getOptionLabel={(option) => option.value}
                defaultValue={[options[0], options[1]]}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Tags" />
                )}
                ChipProps={{
                  sx: { color: "white", backgroundColor: "grey" },
                }}
                sx={{ width: "100%", maxHeight: "20px" }}
              />
            </Stack>
            <Stack width="50%" gap={2} p={2}>
              <Typography>Defect Report Link</Typography>
              <TextField
                placeholder="Enter Defect Report Link"
                value={defectReportLink}
                multiline
                maxRows={5}
                onChange={(ev) => setDefectReportLink(ev.target.value)}
                InputProps={{
                  sx: {
                    fontSize: "12px",
                    borderRadius: "8px",
                    color: "common.white",
                    borderColor: "white",
                    borderWidth: "1px",
                    py: "10px",
                    borderStyle: "solid",
                  },
                }}
              />
            </Stack>
          </Stack>
          <Stack direction="row">
            <Stack width="50%" gap={0.2} p={2}>
              <Typography>End Time</Typography>
              <Autocomplete
                multiple
                limitTags={2}
                id="multiple-limit-tags"
                options={options}
                getOptionLabel={(option) => option.value}
                defaultValue={[options[0], options[1]]}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Tags" />
                )}
                sx={{ width: "100%", maxHeight: "20px" }}
                ChipProps={{
                  sx: { color: "white", backgroundColor: "grey" },
                }}
              />
            </Stack>
            <Stack width="50%" gap={2} p={2}>
              <Typography>Audio Report Link</Typography>
              <TextField
                placeholder="Enter Defect Report Link"
                value={audioReportLink}
                multiline
                maxRows={5}
                onChange={(ev) => setAudioReportLink(ev.target.value)}
                InputProps={{
                  sx: {
                    fontSize: "12px",
                    borderRadius: "8px",
                    color: "common.white",
                    borderColor: "white",
                    borderWidth: "1px",
                    py: "10px",
                    borderStyle: "solid",
                  },
                }}
              />
            </Stack>
          </Stack>
        </Grid>
        <Grid
          xs={4}
          p={2}
          pr={8}
          sx={{
            borderLeft: "1px solid #FFFFFF",
            borderColor: "divider",
            overflowY: "auto",
            position: "relative",
          }}
        >
          <Stack gap={2} p={2}>
            <Typography variant="body2">Description</Typography>
            <TextBox text={text} onChangeText={handleTextChange} />
            <Button
              variant="contained"
              sx={{
                width: "22rem",
                borderRadius: "8px",
                color: "#252525",
                backgroundColor: "#C6D57E",
                fontWeight: "700",
              }}
            >
              Save
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}
