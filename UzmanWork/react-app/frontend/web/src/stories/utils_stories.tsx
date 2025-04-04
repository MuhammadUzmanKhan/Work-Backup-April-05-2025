import { ArchiveClipData, ArchiveComment } from "utils/archives_types";
import { faker } from "@faker-js/faker";
import { DateTime } from "luxon";
import {
  ArchiveSummaryResponse,
  CameraResponse,
  CameraWithOnlineStatus,
  CandidateCameraData,
  KioskWallResponse,
  LicensePlateAlertProfile,
  LicensePlateResponse,
  Location,
  NotificationGroup,
  NVRResponse,
  Organization,
  OrgCamerasAudioSettings,
  OrgCamerasWebRTCSettings,
  VideoOrientationType,
} from "coram-common-utils";
import { QueryObserverResult } from "react-query";
import { ArchiveCommentResponse } from "features/archive/components/ViewArchiveDrawer/components/ViewArchiveDrawerLeftPanel/components/ArchiveComments/types";

// Get a random integer between min and max (inclusive)
export function getRandomInt(min: number, max: number, seed = 123): number {
  faker.seed(seed);
  return faker.number.int({ min: min, max: max - 1 });
}

function randomBoolean(seed = 123): boolean {
  faker.seed(seed);
  return Number(faker.number.binary()) == 1;
}

export function randomMacAddress(seed = 123): string {
  const hex_digits = "0123456789ABCDEF";
  let mac_address = "FF:";
  for (let i = 0; i < 6; i++) {
    mac_address += hex_digits[getRandomInt(0, 16, seed++)];
    mac_address += hex_digits[getRandomInt(0, 16, seed++)];
    if (i != 5) mac_address += ":";
  }
  return mac_address;
}

export function randomIpAddress(seed = 123): string {
  return (
    getRandomInt(0, 255, seed++) +
    1 +
    "." +
    getRandomInt(0, 255, seed++) +
    "." +
    getRandomInt(0, 255, seed++) +
    "." +
    getRandomInt(0, 255, seed++)
  );
}

export function randomCameraVendor(seed = 123): string {
  const vendors = [
    "CoramAI",
    "Hikvision",
    "Cisco Meraki",
    "Axis",
    "Uniview",
    "Pelco",
  ];
  return vendors[getRandomInt(0, vendors.length, seed)];
}

function randomLocationName(seed = 123): string {
  const locations = ["Office 1", "Office 2", "Office 3", "Warehouse 1"];
  return locations[getRandomInt(0, locations.length, seed)];
}

function randomLocationAddress(seed = 123): string {
  const addresses = [
    "1234 Elm Street",
    "5678 Oak Street",
    "91011 Pine Street",
    "1213 Maple Street",
  ];
  return addresses[getRandomInt(0, addresses.length, seed)];
}

export function defaultNvrUUid(): string {
  return "uuid-0";
}

export function randomCameraCandidatesData(
  numCandidates: number
): CandidateCameraData[] {
  const candidates: CandidateCameraData[] = [];
  for (let i = 0; i < numCandidates; i++) {
    candidates.push({
      mac_address: randomMacAddress(i),
      ip: randomIpAddress(i),
      vendor: randomCameraVendor(i),
      nvr_uuids: [defaultNvrUUid()],
    });
  }
  return candidates;
}

export function randomArchiveCommentResponses(
  numComments: number
): ArchiveCommentResponse[] {
  const comments: ArchiveCommentResponse[] = [];
  for (let i = 0; i < numComments; i++) {
    const clipData = i % 2 == 0 ? undefined : randomArchiveClipData(1)[0];
    const comment = faker.lorem.sentence({ min: 3, max: 10 });
    comments.push({
      comment: {
        id: i,
        user_email: faker.internet.email(),
        comment: clipData !== undefined ? (i % 5 == 0 ? "" : comment) : comment,
        creation_time: DateTime.fromJSDate(faker.date.past()),
      },
      attached_clip_data: clipData,
    });
  }
  return comments;
}

export function randomArchiveComments(numComments: number): ArchiveComment[] {
  const comments: ArchiveComment[] = [];
  for (let i = 0; i < numComments; i++) {
    comments.push({
      id: i,
      user_email: faker.internet.email(),
      comment: faker.lorem.sentence({ min: 3, max: 10 }),
      creation_time: DateTime.fromJSDate(faker.date.past()),
    });
  }
  return comments;
}

export function randomArchivesSummary(
  numComments: number
): ArchiveSummaryResponse[] {
  const summary: ArchiveSummaryResponse[] = [];
  for (let i = 0; i < numComments; i++) {
    summary.push({
      id: i,
      title: faker.lorem.sentence({ min: 3, max: 10 }),
      description: faker.lorem.paragraph(),
    });
  }
  return summary;
}

export function randomArchiveClipData(
  numComments: number,
  archiveId = 1
): ArchiveClipData[] {
  const clips: ArchiveClipData[] = [];
  for (let i = 0; i < numComments; i++) {
    clips.push({
      clip_id: i,
      archive_id: archiveId,
      clip_creator_email: faker.internet.email(),
      creation_time: DateTime.fromJSDate(faker.date.past()),
      clip: {
        mac_address: randomMacAddress(),
        start_time: DateTime.fromJSDate(faker.date.past()),
        end_time: DateTime.fromJSDate(faker.date.past()),
        creation_time: DateTime.fromJSDate(faker.date.past()),
        kvs_stream_name: faker.lorem.word(),
        s3_path: faker.lorem.word(),
        id: i,
      },
    });
  }
  return clips;
}

export function getTestKioskWallResponse(idx: number): KioskWallResponse {
  return {
    wall: {
      owner_user_email: "owner_user_email1",
      name: `wall${idx}`,
      id: idx,
    },
    wall_tiles: [
      {
        wall_tile: {
          camera_mac_address: "mac_address1",
          x_start_tile: idx,
          y_start_tile: 0,
          width_tiles: 2,
          height_tiles: 2,
        },
        camera_data: {
          mac_address: "mac_address1",
          name: "camera1",
          is_enabled: true,
          is_online: true,
          is_webrtc_enabled: true,
        },
      },
      {
        wall_tile: {
          camera_mac_address: "mac_address2",
          x_start_tile: 1 + idx,
          y_start_tile: 2,
          width_tiles: 1,
          height_tiles: 1,
        },
        camera_data: {
          mac_address: "mac_address2",
          name: "camera2",
          is_enabled: true,
          is_online: true,
          is_webrtc_enabled: true,
        },
      },
      {
        wall_tile: {
          camera_mac_address: "mac_address3",
          x_start_tile: 2 + idx,
          y_start_tile: 2,
          width_tiles: 1,
          height_tiles: 1,
        },
        camera_data: {
          mac_address: "mac_address3",
          name: "camera3",
          is_enabled: true,
          is_online: true,
          is_webrtc_enabled: true,
        },
      },
      {
        wall_tile: {
          x_start_tile: 2 + idx,
          y_start_tile: 1,
          width_tiles: 1,
          height_tiles: 1,
        },
        // Empty tile, so no camera data
      },
    ],
  };
}

export function generateRefetchStreamsStub<TData>() {
  return async () =>
    Promise.resolve({
      data: null,
      error: null,
      isError: false,
      isIdle: false,
      isLoading: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      status: "success",
    }) as Promise<QueryObserverResult<TData>>;
}

export function generateRandomNotificationGroups(
  numGroups: number
): NotificationGroup[] {
  const groups = [];
  for (let i = 0; i < numGroups; i++) {
    groups.push({
      id: i,
      name: faker.lorem.word(),
      members: [],
    });
  }
  return groups;
}

export function randomLicensePlateNumber(): string {
  const digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let licensePlateNumber = "";
  const length = getRandomInt(6, 7);

  for (let i = 0; i < length; i++) {
    licensePlateNumber += digits[getRandomInt(0, digits.length - 1)];
  }
  return licensePlateNumber;
}

export function randomLicensePlateAlertProfile(): LicensePlateAlertProfile {
  return {
    license_plate_number: randomLicensePlateNumber(),
    owner_user_email: faker.internet.email(),
    creation_time: DateTime.fromJSDate(faker.date.past()).toISO() || "",
    id: getRandomInt(0, 100),
    notification_groups: [],
    image_s3_path: faker.lorem.word(),
    x_min: 0,
    x_max: 200,
    y_min: 50,
    y_max: 150,
  };
}

export function generateRandomLicensePlateResponses(
  numResponses: number
): LicensePlateResponse[] {
  const responses = [];
  for (let i = 0; i < numResponses; i++) {
    const alertProfile = randomLicensePlateAlertProfile();

    responses.push({
      license_plate: {
        license_plate_number: alertProfile.license_plate_number,
        camera_mac_address: randomMacAddress(),
        last_seen: DateTime.fromJSDate(faker.date.past()).toISO() || "",
        num_occurrences: getRandomInt(0, 10),
        x_min: 0,
        x_max: 200,
        y_min: 50,
        y_max: 150,
        camera_name: faker.lorem.word(),
        location_name: faker.lorem.word(),
        image_s3_path: faker.lorem.word(),
        alert_profile: alertProfile,
      },
      s3_signed_url: "https://placehold.co/200x200?text=License Plate",
    });
  }
  return responses;
}

export function generateRandomCameraWithOnlineStatus(
  id: number
): CameraWithOnlineStatus {
  return {
    mac_address: randomMacAddress(id),
    nvr_uuid: defaultNvrUUid(),
    vendor: randomCameraVendor(id),
    ip: randomIpAddress(id),
    is_enabled: randomBoolean(id),
    video_orientation_type: VideoOrientationType.ORIENTATION_IDENTITY,
    is_always_streaming: randomBoolean(id),
    is_license_plate_detection_enabled: randomBoolean(id),
    is_audio_enabled: randomBoolean(id),
    is_faulty: randomBoolean(id),
    is_webrtc_enabled: randomBoolean(id),
    is_force_fps_enabled: randomBoolean(id),
    stream_hash: "stream_hash",
    id: id,
    name: `camera${id}`,
    is_online: randomBoolean(id),
    tenant: "tenant",
    camera_group_id: 0,
  };
}

export function randomLocations(numLocations: number): Map<number, Location> {
  const locations: Map<number, Location> = new Map();
  for (let i = 0; i < numLocations; i++) {
    locations.set(i, {
      id: i,
      name: randomLocationName(i),
      address: randomLocationAddress(i),
      timezone: "America/Los_Angeles",
      enable_setting_timezone: false,
    });
  }
  return locations;
}

export function randomCameraResponses(idx: number): CameraResponse[] {
  const responses = [];
  for (let i = 0; i < idx; i++) {
    const camera: CameraResponse = {
      camera: generateRandomCameraWithOnlineStatus(i),
      group_name: "Test 3",
      location_id: 0,
      location: randomLocationName(i),
      nvr_timezone: "America/Los_Angeles",
      timezone: "America/Los_Angeles",
      org_name: "Coram",
      nvr_name: "nvr_name",
      is_default_group: false,
    };
    responses.push(camera);
  }
  return responses;
}

export function randomNVRDevicesResponse(idx: number): NVRResponse[] {
  const responses = [];
  for (let i = 0; i < idx; i++) {
    const nvr: NVRResponse = {
      id: i,
      uuid: `uuid-nvr-${i}`,
      location_id: i,
      last_seen_time: DateTime.fromJSDate(faker.date.past()).toISO() || "",
      is_online: randomBoolean(i),
      location_name: randomLocationName(i),
      address: faker.location.streetAddress(),
      address_lat: 0,
      address_lon: 0,
      num_cameras_enabled: getRandomInt(0, 10, i),
      num_cameras_disabled: getRandomInt(0, 10, i),
      org_name: randomOrgName(i),
      org_tenant: "tenant",
      retention_days: 30,
      num_available_cameras_slots: 8,
      max_cameras_slots: 16,
      internet_status: {
        timestamp: DateTime.fromJSDate(faker.date.past()).toISO() || "",
        domain: "8.8.8.8",
        avg_ping_latency_ms: getRandomInt(0, 100, i),
        packet_loss: 0.5,
      },
    };
    responses.push(nvr);
  }
  return responses;
}

function randomOrgName(seed = 123): string {
  faker.seed(seed);
  return faker.company.name();
}

export function randomOrganizations(
  numOrgs: number
): Map<number, Organization> {
  const orgs: Map<number, Organization> = new Map();
  for (let i = 0; i < numOrgs; i++) {
    orgs.set(i, {
      tenant: "tenant",
      name: randomOrgName(i),
      id: i,
      retention_hours_always_on_streams: 168,
      low_res_bitrate_kbps: 512,
      inactive_user_logout_enabled: false,
      cameras_audio_settings: OrgCamerasAudioSettings.MANUAL,
      cameras_webrtc_settings: OrgCamerasWebRTCSettings.MANUAL,
    });
  }
  return orgs;
}
