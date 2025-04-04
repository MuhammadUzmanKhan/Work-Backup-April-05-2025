import { Stack, TextField, Typography } from "@mui/material";

interface EditNameProps {
  name: string;
  setName: (name: string) => void;
}

export function EditName({ name, setName }: EditNameProps) {
  return (
    <Stack gap={1}>
      <Typography variant="body1" color="#83889E">
        Report name
      </Typography>
      <TextField
        placeholder="Enter Report Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        size="small"
      />
    </Stack>
  );
}
