import { IsBoolean, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class DispatchCenterDto {
  @IsBoolean()
  enter_incident_division: boolean;

  @IsBoolean()
  enter_incident_type: boolean;

  @IsBoolean()
  enter_incident_location: boolean;

  @IsBoolean()
  add_description: boolean;

  @IsBoolean()
  dispatch_unit: boolean;

  @IsBoolean()
  status_of_incident: boolean;

  @IsBoolean()
  add_comment: boolean;

  @IsBoolean()
  add_event_note: boolean;

  @IsBoolean()
  add_scan_count: boolean;

  @IsBoolean()
  check_map_view: boolean;

  @IsBoolean()
  change_division_dropdown: boolean;

  @IsBoolean()
  change_department_dropdown: boolean;

  @IsBoolean()
  search_box: boolean;
}

class IncidentZoneDto {
  @IsBoolean()
  main_zone: boolean;

  @IsBoolean()
  sub_zone: boolean;

  @IsBoolean()
  change_color: boolean;

  @IsBoolean()
  map_zoom_in_and_out: boolean;

  @IsBoolean()
  drop_zone: boolean;

  @IsBoolean()
  zone_detail: boolean;

  @IsBoolean()
  list_view_and_rename: boolean;

  @IsBoolean()
  list_view_find_zone: boolean;

  @IsBoolean()
  delete_zone: boolean;

  @IsBoolean()
  street_view: boolean;

  @IsBoolean()
  satellite_view: boolean;
}

class IncidentDashboardDto {
  @IsBoolean()
  change_date_incident_range: boolean;

  @IsBoolean()
  check_filter_incident_overview: boolean;

  @IsBoolean()
  move_around_map: boolean;

  @IsBoolean()
  use_dropdown: boolean;

  @IsBoolean()
  street_view: boolean;

  @IsBoolean()
  satellite_view: boolean;

  @IsBoolean()
  view_staff: boolean;

  @IsBoolean()
  change_department: boolean;

  @IsBoolean()
  search_staff: boolean;

  @IsBoolean()
  toggle_incident: boolean;
}
class IncidentModuleSetupDto {
  @IsBoolean()
  check_uncheck_source: boolean;

  @IsBoolean()
  select_unselect_all: boolean;

  @IsBoolean()
  create_source_and_division: boolean;

  @IsBoolean()
  check_search: boolean;

  @IsBoolean()
  delete_source_and_division: boolean;

  @IsBoolean()
  edit_source_and_division: boolean;

  @IsBoolean()
  click_incident_zone: boolean;

  @IsBoolean()
  incident_module_alert: boolean;
}

class WorkforceStaffDto {
  @IsBoolean()
  click_department: boolean;

  @IsBoolean()
  search_box: boolean;

  @IsBoolean()
  change_Division_dropdown: boolean;

  @IsBoolean()
  change_department_dropdown: boolean;

  @IsBoolean()
  add_new_staff: boolean;

  @IsBoolean()
  add_existing_staff: boolean;

  @IsBoolean()
  add_department: boolean;

  @IsBoolean()
  correct_popup_appear: boolean;

  @IsBoolean()
  edit_message_map: boolean;

  @IsBoolean()
  popup_display: boolean;
}
export class PreEventChecklistPdfDto {
  @IsObject()
  @Type(() => DispatchCenterDto)
  @ValidateNested({ each: true })
  dispatch_center: DispatchCenterDto;

  @IsObject()
  @Type(() => IncidentZoneDto)
  @ValidateNested({ each: true })
  incident_zone: IncidentZoneDto;

  @IsObject()
  @Type(() => IncidentDashboardDto)
  @ValidateNested({ each: true })
  incident_dashboard: IncidentDashboardDto;

  @IsObject()
  @Type(() => IncidentModuleSetupDto)
  @ValidateNested({ each: true })
  incident_module_setup: IncidentModuleSetupDto;

  @IsObject()
  @Type(() => WorkforceStaffDto)
  @ValidateNested({ each: true })
  workforce_staff: WorkforceStaffDto;
}
