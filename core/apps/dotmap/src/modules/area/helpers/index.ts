import { NotFoundException } from '@nestjs/common';
import { RESPONSES } from '@ontrack-tech-group/common/constants';
import { Area } from '@ontrack-tech-group/common/models';

export const isAreaExist = async (id: number) => {
  const area = await Area.findByPk(id, { attributes: ['id'] });

  if (!area) throw new NotFoundException(RESPONSES.notFound('Area'));
};
