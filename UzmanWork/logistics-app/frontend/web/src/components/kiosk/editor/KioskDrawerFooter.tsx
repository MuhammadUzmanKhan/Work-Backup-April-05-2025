import { Button, Stack, TextField, Tooltip, Typography } from "@mui/material";

interface KioskDrawerFooterProps {
  submitButtonText: string;
  rotationFreqFieldHidden: boolean;
  rotationFreqS: number;
  setRotationFreqS: (rotationFreqS: number) => void;
  minRotationFreqAllowedS: number;
  onClick: () => Promise<void>;
  isSubmitDisabled: boolean;
}

export function KioskDrawerFooter({
  submitButtonText,
  rotationFreqFieldHidden,
  rotationFreqS,
  setRotationFreqS,
  minRotationFreqAllowedS,
  onClick,
  isSubmitDisabled,
}: KioskDrawerFooterProps) {
  const isRotationFreqValid = rotationFreqS >= minRotationFreqAllowedS;
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1}
      px={1}
      py={2}
      justifyContent="space-between"
    >
      {!rotationFreqFieldHidden && (
        <>
          <Tooltip
            title={
              isRotationFreqValid
                ? ""
                : `The minimum duration on each wall is ${minRotationFreqAllowedS} seconds.`
            }
            placement="top"
          >
            <TextField
              type="number"
              value={rotationFreqS}
              error={!isRotationFreqValid}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                // TODO: Don't allow user to enter negative numbers.
                setRotationFreqS(parseInt(event.target.value));
              }}
              sx={{
                input: {
                  width: "40px",
                  height: "2px",
                },
              }}
            />
          </Tooltip>
          <Typography variant="body2">Seconds duration on each wall</Typography>
        </>
      )}
      <Button
        variant="contained"
        color="secondary"
        sx={{
          paddingX: "2.5rem",
          paddingY: "0.4rem",
          borderRadius: "4px",
          marginLeft: "auto",
        }}
        onClick={onClick}
        disabled={isSubmitDisabled}
      >
        {submitButtonText}
      </Button>
    </Stack>
  );
}
