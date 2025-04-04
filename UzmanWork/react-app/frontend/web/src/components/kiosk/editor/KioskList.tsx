import { Divider, List } from "@mui/material";
import { KioskListItem } from "./KioskListItem";
import {
  Wall,
  Kiosk,
  UpdateWallsForKioskRequest,
  UpdateKioskStatusRequest,
  RenameKioskRequest,
  ShareKioskRequest,
} from "coram-common-utils";
import { Fragment } from "react";

interface KioskListProps {
  kiosks: Kiosk[];
  userWalls: Wall[];
  currentUserEmail: string;
  onUpdateKioskWalls: (request: UpdateWallsForKioskRequest) => Promise<void>;
  onUpdateKioskStatus: (request: UpdateKioskStatusRequest) => Promise<void>;
  onRemoveKiosk: (kiosk_id: number) => Promise<void>;
  onRegenerateKioskHash: (kiosk_id: number) => Promise<void>;
  onRenameKiosk: (request: RenameKioskRequest) => Promise<void>;
  onShareKiosk: (request: ShareKioskRequest) => Promise<void>;
}

export function KioskList({
  kiosks,
  userWalls,
  currentUserEmail,
  onUpdateKioskWalls,
  onUpdateKioskStatus,
  onRemoveKiosk,
  onRegenerateKioskHash,
  onRenameKiosk,
  onShareKiosk,
}: KioskListProps) {
  return (
    <List>
      {kiosks.map((kiosk, index) => (
        <Fragment key={index}>
          <KioskListItem
            kiosk={kiosk}
            userWalls={userWalls}
            currentUserEmail={currentUserEmail}
            onUpdateKioskWalls={onUpdateKioskWalls}
            onUpdateKioskStatus={onUpdateKioskStatus}
            onRemoveKiosk={onRemoveKiosk}
            onRegenerateKioskHash={onRegenerateKioskHash}
            onRenameKiosk={onRenameKiosk}
            onShareKiosk={onShareKiosk}
          />
          <Divider variant="fullWidth" component="li" />
        </Fragment>
      ))}
    </List>
  );
}
