import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getUserRoleFromCompanyId } from '../../helpers';

export const AuthUser = createParamDecorator(
  async (data, req: ExecutionContext): Promise<any> => {
    const user = req.switchToHttp().getRequest().user;

    // geting selected role of that user
    const { role, category, region_ids } = await getUserRoleFromCompanyId(user);

    return {
      ...user,
      role,
      category,
      region_ids,
    };
  },
);
