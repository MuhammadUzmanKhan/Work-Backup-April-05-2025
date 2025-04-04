import { Sequelize } from 'sequelize';
import { NotFoundException } from '@nestjs/common';
import { Options, RESPONSES } from '@ontrack-tech-group/common/constants';
import { ResolvedIncidentNote } from '@ontrack-tech-group/common/models';

export const isResolvedIncidentNoteExist = async (
  event_id?: number,
  incident_id?: number,
  id?: number,
) => {
  const where = {};

  if (event_id) where['event_id'] = event_id;

  if (incident_id) where['incident_id'] = incident_id;

  if (id) where['id'] = id;

  return await ResolvedIncidentNote.findOne({
    where,
    attributes: ['id', 'status', 'event_id'],
  });
};

export const getResolvedIncidentNoteByIdHelper = async (
  id: number,
  options?: Options,
) => {
  const resolvedIncidentNote = await ResolvedIncidentNote.findOne({
    where: { id },
    attributes: {
      exclude: ['createdAt', 'updatedAt'],
      include: [
        [
          Sequelize.cast(
            Sequelize.col('"ResolvedIncidentNote"."id"'),
            'integer',
          ),
          'id',
        ],
        [ResolvedIncidentNote.getStatusNameByKey, 'status'],
      ],
    },
    ...options,
  });

  if (!resolvedIncidentNote)
    throw new NotFoundException(RESPONSES.notFound('Resolved Incident Note'));

  return resolvedIncidentNote;
};
