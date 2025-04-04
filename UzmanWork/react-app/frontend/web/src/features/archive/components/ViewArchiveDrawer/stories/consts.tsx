import {
  randomArchiveClipData,
  randomArchiveComments,
} from "stories/utils_stories";
import { DateTime } from "luxon";
import { ArchiveResponse } from "utils/archives_types";

export const COMMENTS = randomArchiveComments(25);
export const CLIPS = randomArchiveClipData(4);

export const ARCHIVE: ArchiveResponse = {
  id: 1,
  title: "Test Archive",
  description:
    "This is a description for the card archive. It will be truncated if it is too long. Like in this case.",
  creation_time: DateTime.now(),
  owner_user_email: "test@gmail.com",
  share_infos: [
    { archive_id: 1, user_email: "newUser@gmail.com" },
    { archive_id: 2, user_email: "anotherUser@gmail.com" },
  ],
  clips: CLIPS,
  comments: COMMENTS,
  clips_preview_thumbnails: new Map(),
};

export const ARCHIVE_WITH_NO_COMMENTS: ArchiveResponse = {
  ...ARCHIVE,
  comments: [],
};
