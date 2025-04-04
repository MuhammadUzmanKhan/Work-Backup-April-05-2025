import { NotFoundException } from '@nestjs/common';
import { RESPONSES } from '@ontrack-tech-group/common/constants';
import { Position } from '@ontrack-tech-group/common/models';

export const isPositionExist = async (id: number) => {
  const position = await Position.findByPk(id, { attributes: ['id'] });

  if (!position) throw new NotFoundException(RESPONSES.notFound('Position'));
};
