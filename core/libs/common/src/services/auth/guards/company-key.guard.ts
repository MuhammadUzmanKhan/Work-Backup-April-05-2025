import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Company } from '../../../models';

@Injectable()
export class CompanyKeyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const xApiKey = request.headers['x-api-key'];

    if (xApiKey) {
      const company = await Company.findOne({ where: { api_key: xApiKey } });

      if (company) {
        request.query['company_id'] = company.id;
        return true;
      }
    }

    return false;
  }
}
