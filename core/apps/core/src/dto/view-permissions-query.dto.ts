import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PermissionModules } from '@Common/constants';

export class ViewPermissionsQueryDto {
  @ApiPropertyOptional({
    description:
      'module can be: event, company, user_company, task, task_category, task_list, task_subtask, incident, incident_type, incident_division, incident_zone, source, priority_guide, alert, filter, fuel_type, incident_message_center, mobile_incident_inbox, preset_message, reference_map, scan, department, inventory, inventory_type, inventory_type_category, inventory_zone, point_of_interest, point_of_interest_type, scheduling, user, dashboard, cad, cad_type, global_incident, legal_chat,preset',
  })
  @IsOptional()
  @IsEnum(PermissionModules, { each: true })
  module: PermissionModules[];
}
