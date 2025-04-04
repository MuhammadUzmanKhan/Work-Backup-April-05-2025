import { StaticResolutionConfig } from "../backend_client";
import { StreamResponse } from "./kinesis";

export type LiveStreamResponseData = StreamResponse & {
  resolutionConfig: StaticResolutionConfig;
};
