import { useState } from "react";
import { Stack, Typography } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import grey from "@mui/material/colors/grey";

interface CollapsableTextProps {
  text: string;
  numWordsLimit: number;
}

function truncateText(text: string, limit: number) {
  const words = (text || "").split(" ");
  return words.slice(0, limit).join(" ");
}

export function CollapsableText({ text, numWordsLimit }: CollapsableTextProps) {
  const [showFullText, setShowFullText] = useState(false);

  // Determine whether to display the full text or the truncated text
  const displayText = showFullText ? text : truncateText(text, numWordsLimit);

  return (
    <Stack gap={0.6} onClick={() => setShowFullText(!showFullText)}>
      <Typography variant="body1" color={grey[600]}>
        {displayText}
      </Typography>
      {text && text.split(" ").length > numWordsLimit && (
        <Stack direction="row" alignItems="center">
          <Typography variant="body1" color={grey[600]}>
            {showFullText ? "Show Less" : "See More"}
          </Typography>
          {showFullText ? (
            <KeyboardArrowUpIcon fontSize="small" />
          ) : (
            <ChevronRightIcon fontSize="small" />
          )}
        </Stack>
      )}
    </Stack>
  );
}
