import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { COMPANY_ID_API_HEADER } from '@ontrack-tech-group/common/constants';
import { IncidentService } from './incident.service';

@ApiTags('Incidents')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('incidents')
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}
}
