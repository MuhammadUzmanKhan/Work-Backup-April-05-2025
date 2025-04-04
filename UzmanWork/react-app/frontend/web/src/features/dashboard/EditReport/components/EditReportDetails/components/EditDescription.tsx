import { Stack, TextField, Typography } from "@mui/material";

interface EditDescriptionProps {
  description: string;
  setDescription: (description: string) => void;
}

export function EditDescription({
  description,
  setDescription,
}: EditDescriptionProps) {
  return (
    <Stack gap={1}>
      <Typography variant="body1" color="#83889E">
        Description
      </Typography>
      <TextField
        placeholder="Report Description"
        value={description}
        multiline={true}
        rows={3}
        size="small"
        onChange={(e) => setDescription(e.target.value)}
      />
    </Stack>
  );
}
