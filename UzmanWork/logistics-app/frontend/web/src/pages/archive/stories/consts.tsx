import {
  randomArchiveClipData,
  randomArchiveComments,
} from "stories/utils_stories";
import { ArchiveResponse } from "utils/archives_types";
import { DateTime } from "luxon";

const COMMENTS_1 = randomArchiveComments(25);
const COMMENTS_2 = randomArchiveComments(25);
const CLIPS_1 = randomArchiveClipData(4, 1);
const CLIPS_2 = randomArchiveClipData(3, 2);

export const ARCHIVES: ArchiveResponse[] = [
  {
    id: 1,
    title: "First Archive",
    description: "First archive description is here.",
    creation_time: DateTime.now(),
    owner_user_email: "firstUser@gmail.com",
    share_infos: [
      { archive_id: 1, user_email: "secondUser@gmail.com" },
      { archive_id: 2, user_email: "anotherTest@gmail.com" },
    ],
    clips: CLIPS_1,
    comments: COMMENTS_1,
    clips_preview_thumbnails: new Map(),
  },

  {
    id: 2,
    title: "Second Archive",
    description: "Second archive description is here.",
    creation_time: DateTime.now(),
    owner_user_email: "secondUser@gmail.com",
    share_infos: [
      { archive_id: 0, user_email: "firstUser@gmail.com" },
      { archive_id: 2, user_email: "anotherTest@gmail.com" },
    ],
    clips: CLIPS_2,
    comments: COMMENTS_2,
    clips_preview_thumbnails: new Map(),
  },
];
