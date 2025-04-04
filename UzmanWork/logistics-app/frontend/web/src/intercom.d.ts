interface IntercomSettings {
  api_base?: string;
  app_id?: string;
  email?: string;
  name?: string;
  alignment?: "left" | "right";
  horizontal_padding?: string;
  vertical_padding?: string;
  custom_launcher_selector?: string;
  hide_default_launcher?: boolean;
}

interface Window {
  intercomSettings: IntercomSettings;

  Intercom(command: "boot" | "update", settings?: IntercomSettings): void;

  Intercom(command: "shutdown"): void;
}
