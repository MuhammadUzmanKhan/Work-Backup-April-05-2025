import type { TextFieldProps } from "@mui/material";
import { Chip, TextField } from "@mui/material";
import { Dispatch, KeyboardEvent, SetStateAction } from "react";
import { emailIsInvalid } from "./EmailTextField";
import { ShareWithEmails } from "./ShareDialog";

type MultiEmailTextFieldProps = TextFieldProps & {
  setShareWithEmails: Dispatch<SetStateAction<ShareWithEmails>>;
  shareWithEmails: ShareWithEmails;
};

function isEmailSeparator(key: string) {
  return key === "Enter" || key === "," || key === " ";
}

export function MultiEmailTextField(props: MultiEmailTextFieldProps) {
  const { setShareWithEmails, shareWithEmails, ...restProps } = props;

  const handleEmailChipDelete = (email: string) => {
    setShareWithEmails((prevState: ShareWithEmails) => {
      return {
        ...prevState,
        finalizedEmails: prevState.finalizedEmails.filter((e) => e !== email),
      };
    });
  };

  const handleEmailInputKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isEmailSeparator(e.key) && shareWithEmails.currentEmail !== "") {
      if (emailIsInvalid(shareWithEmails.currentEmail)) {
        return;
      }
      setShareWithEmails((prevState: ShareWithEmails) => {
        return {
          currentEmail: "",
          finalizedEmails: prevState.finalizedEmails.concat([
            shareWithEmails.currentEmail,
          ]),
        };
      });
    } else if (e.key === "Backspace" && shareWithEmails.currentEmail === "") {
      setShareWithEmails((prevState: ShareWithEmails) => {
        return {
          ...prevState,
          finalizedEmails: prevState.finalizedEmails.slice(0, -1),
        };
      });
    }
  };

  const isInvalidEmail =
    emailIsInvalid(shareWithEmails.currentEmail) &&
    isEmailSeparator(
      shareWithEmails.currentEmail[shareWithEmails.currentEmail.length - 1]
    );

  return (
    <TextField
      {...restProps}
      value={shareWithEmails.currentEmail}
      error={isInvalidEmail}
      onKeyDown={handleEmailInputKeyPress}
      label="Enter E-mail Addresses (separate with Enter, space or comma)"
      onChange={(e) => {
        if (!isEmailSeparator(e.target.value)) {
          setShareWithEmails((prevState: ShareWithEmails) => {
            return {
              ...prevState,
              currentEmail: e.target.value,
            };
          });
        }
      }}
      autoComplete="off"
      InputProps={{
        sx: {
          flexWrap: "wrap",
          gap: 1,
          py: "15px",
          "& input": {
            flex: 1,
            width: "auto",
            minWidth: "100px",
            padding: "0",
          },
        },
        startAdornment: shareWithEmails.finalizedEmails.map((email) => (
          <Chip
            key={email}
            label={email}
            onDelete={() => handleEmailChipDelete(email)}
          />
        )),
      }}
      helperText={
        emailIsInvalid(props.value as string | undefined)
          ? "Enter a valid email address."
          : ""
      }
    />
  );
}
