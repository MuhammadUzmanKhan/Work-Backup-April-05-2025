import { NotFoundException } from '@nestjs/common';
import { CadType } from '@ontrack-tech-group/common/models';
import { RESPONSES } from '@ontrack-tech-group/common/constants';
import { _ERRORS } from '@Common/constants';

export const isCadTypeIdExists = async (cadTypeId: number) => {
  const cadType = await CadType.findByPk(cadTypeId, {
    attributes: ['id'],
  });

  if (!cadType) throw new NotFoundException(RESPONSES.notFound('Cad Type'));
};
