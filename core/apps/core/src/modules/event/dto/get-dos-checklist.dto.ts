import { Type } from 'class-transformer';
import { IsBoolean, IsObject, ValidateNested } from 'class-validator';

class DevicesDto {
  @IsBoolean()
  all_devices: boolean;

  @IsBoolean()
  all_command: boolean;

  @IsBoolean()
  all_web_users: boolean;

  @IsBoolean()
  the_onTrack: boolean;

  @IsBoolean()
  field_devices: boolean;

  @IsBoolean()
  all_field: boolean;
}

class SetupDto {
  @IsBoolean()
  staff_logins: boolean;

  @IsBoolean()
  incident_module_setup: boolean;

  @IsBoolean()
  incident_zones: boolean;
}

class DispatchCenterDto {
  @IsBoolean()
  create_an_incident: boolean;

  @IsBoolean()
  cycle_incidents: boolean;

  @IsBoolean()
  test_dispatching: boolean;

  @IsBoolean()
  check_map_view: boolean;

  @IsBoolean()
  test_messaging: boolean;
}

class IncidentsDashboardDto {
  @IsBoolean()
  test_gps: boolean;

  @IsBoolean()
  tracked_field: boolean;
}

class OtherModulesDto {
  @IsBoolean()
  messaging_center: boolean;
}

export class DosChecklistPdfDto {
  @IsObject()
  @Type(() => DevicesDto)
  @ValidateNested({ each: true })
  devices: DevicesDto;

  @IsObject()
  @Type(() => SetupDto)
  @ValidateNested({ each: true })
  setup: SetupDto;

  @IsObject()
  @Type(() => DispatchCenterDto)
  @ValidateNested({ each: true })
  dispatch_center: DispatchCenterDto;

  @IsObject()
  @Type(() => IncidentsDashboardDto)
  @ValidateNested({ each: true })
  incidents_dashboard: IncidentsDashboardDto;

  @IsObject()
  @Type(() => OtherModulesDto)
  @ValidateNested({ each: true })
  other_modules: OtherModulesDto;
}
