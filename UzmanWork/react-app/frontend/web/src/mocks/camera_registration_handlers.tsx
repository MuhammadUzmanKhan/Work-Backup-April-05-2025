import {
  CandidateCameraData,
  OpenAPI,
  RegisterCandidateCamerasResponse,
} from "coram-common-utils";
import { rest } from "msw";
import {
  defaultNvrUUid,
  randomCameraCandidatesData,
} from "stories/utils_stories";

const BASE = "http://msw";
OpenAPI.BASE = BASE;

const CAMERA_CANDIDATES_MAP: Map<string, CandidateCameraData[]> = new Map();

export const camera_registration_handlers = {
  camera_registration: [
    rest.get(
      `${BASE}/cameras_registration/candidate_cameras/:location_id`,
      async (req, res, ctx) => {
        const { location_id } = req.params;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (!CAMERA_CANDIDATES_MAP.has(location_id as string)) {
          CAMERA_CANDIDATES_MAP.set(
            location_id as string,
            randomCameraCandidatesData(10)
          );
        }

        return res(
          ctx.status(200),
          ctx.json({
            candidate_cameras_data: CAMERA_CANDIDATES_MAP.get(
              location_id as string
            ),
            unavailable_nvr_uuids: [],
            candidate_nvrs_data: [
              {
                nvr_uuid: defaultNvrUUid(),
                num_available_slots: 5,
              },
            ],
          })
        );
      }
    ),
    rest.post(
      `${BASE}/cameras_registration/register_candidates/:location_id`,
      async (req, res, ctx) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const data = await req.json();
        const assignments = data.candidate_cameras_data.map(() => ({}));
        const outcome: RegisterCandidateCamerasResponse = {
          successful_assignments: assignments,
          failed_assignments: [],
        };
        return res(ctx.status(200), ctx.json(outcome));
      }
    ),
  ],
};

export const camera_registration_handlers_no_candidates = {
  camera_registration: [
    rest.get(
      `${BASE}/cameras_registration/candidate_cameras/:location_id`,
      async (req, res, ctx) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return res(
          ctx.status(200),
          ctx.json({
            candidate_cameras_data: [],
            unavailable_nvr_uuids: [],
            candidate_nvrs_data: [
              {
                nvr_uuid: defaultNvrUUid(),
                num_available_slots: 5,
              },
            ],
          })
        );
      }
    ),

    rest.post(
      `${BASE}/cameras_registration/register_candidates`,
      async (req, res, ctx) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const data = await req.json();
        const assignments = data.candidate_cameras_data.map(() => ({}));
        const outcome: RegisterCandidateCamerasResponse = {
          successful_assignments: assignments,
          failed_assignments: [],
        };
        return res(ctx.status(200), ctx.json(outcome));
      }
    ),
  ],
};
