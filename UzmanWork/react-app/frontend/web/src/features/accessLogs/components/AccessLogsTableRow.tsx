import {
  TableRow,
  TableCell,
  Stack,
  Avatar,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import { AccessLogsResponse, isDefined } from "coram-common-utils";
import { DateTime } from "luxon";
import { AccessLogDetailsRow } from "./AccessLogDetailsRow";
import { useState } from "react";
import {
  KeyboardArrowRight as KeyboardArrowRightIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import { AccessLogPlayableInfo, getPlayableClipInfo } from "./types";
import { ActionButton } from "components/styled_components/ActionButton";
import { AccessLogCameraInfoMap } from "../types";

interface AccessLogTableRowProps {
  log: AccessLogsResponse;
  camerasInfoMap: AccessLogCameraInfoMap;
}

export function AccessLogTableRow({
  log,
  camerasInfoMap,
}: AccessLogTableRowProps) {
  const [open, setOpen] = useState(false);

  const playableInfo = getPlayableClipInfo(log, camerasInfoMap);

  const hasDetail =
    log.details &&
    Object.entries(log.details).filter(([key]) => key !== "url_path").length >
      0;

  function onPlayableInfoClick(info: AccessLogPlayableInfo) {
    let url = `/timeline/${info.cameraId}`;
    switch (info.type) {
      case "live":
        break;
      case "clip":
        url += `?ts=${info.startTime.toMillis()}&te=${info.endTime.toMillis()}`;
        break;
      default: {
        const _exhaustiveCheck: never = info;
        console.error(`invalid info type ${info}`);
        return _exhaustiveCheck;
      }
    }
    window.open(url, "_blank");
  }

  return (
    <>
      <TableRow key={log.timestamp} sx={{ "& td": { borderLeft: 0 } }}>
        <TableCell>
          <Stack direction="row" alignItems="center">
            {hasDetail ? (
              <IconButton
                aria-label="expand row"
                size="small"
                onClick={() => setOpen(!open)}
              >
                {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowRightIcon />}
              </IconButton>
            ) : (
              <IconButton size="small">
                <Box p={1.5}></Box>
              </IconButton>
            )}
            <Typography variant="body3">
              {DateTime.fromISO(log.timestamp).toLocaleString(
                DateTime.DATETIME_FULL
              )}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Stack
            direction="row"
            spacing={1}
            justifyContent="start"
            alignItems="center"
          >
            <Avatar
              sx={{
                bgcolor: "neutral.200",
                color: "common.black",
                fontSize: "14px",
                width: "25px",
                height: "25px",
              }}
            >
              {`${log.user_email[0] || "U"}`.toUpperCase()}
            </Avatar>
            <Typography variant="body2">{log.user_email}</Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">{log.action}</Typography>
            {isDefined(playableInfo) && (
              <ActionButton
                color="secondary"
                onClick={() => onPlayableInfoClick(playableInfo)}
              >
                <OpenInNewIcon sx={{ fontSize: 16 }} />
              </ActionButton>
            )}
          </Stack>
        </TableCell>
      </TableRow>
      {isDefined(log.details) && (
        <AccessLogDetailsRow
          open={open}
          logDetails={log.details}
          camerasInfoMap={camerasInfoMap}
        />
      )}
    </>
  );
}
