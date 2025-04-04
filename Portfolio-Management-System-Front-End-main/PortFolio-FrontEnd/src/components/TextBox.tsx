import Box from "@mui/material/Box";
import { useState } from "react";

interface TextBoxProps {
  text: string;
  onChangeText: (newText: string) => void;
}

export function TextBox({ text, onChangeText }: TextBoxProps) {
  const [editingText, setEditingText] = useState(text);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditingText(event.target.value);
  };

  const handleInputBlur = () => {
    onChangeText(editingText);
  };

  return (
    <Box
      sx={{
        backgroundColor: "neutral.A300",
        width: "20rem",
        height: "28rem",
        borderRadius: "10px",
        border: "1px solid #FFFFFF",
        p: "1rem",
        pt: "0px",
        textAlign: "start",
      }}
    >
      <input
        type="text"
        value={editingText}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder="Enter Description..."
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          outline: "none",
          display: "flex",
          flexWrap: "nowrap",
          backgroundColor: "transparent",
          textAlign: "start",
          color: "#FFF",
          padding: "0",
        }}
      />
    </Box>
  );
}
