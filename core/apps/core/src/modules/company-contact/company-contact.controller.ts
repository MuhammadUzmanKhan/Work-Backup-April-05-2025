import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { COMPANY_ID_API_HEADER } from '@ontrack-tech-group/common/constants';
import { CompanyContactService } from './company-contact.service';

@ApiTags('Company Contact')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('company-contact')
export class CompanyContactController {
  constructor(private readonly companyContactService: CompanyContactService) {}
}
