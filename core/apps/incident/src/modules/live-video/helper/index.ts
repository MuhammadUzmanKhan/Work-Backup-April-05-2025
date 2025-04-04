import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { LiveVideo } from '@ontrack-tech-group/common/models';
import { LiveVideoModeEnum } from '@Common/constants';
import { GetAllLiveVideosDto } from '../dto';

export const getAllVideosWhere = (getAllLiveVideosDto: GetAllLiveVideosDto) => {
  const { event_id } = getAllLiveVideosDto;
  const _where = {};

  _where['event_id'] = event_id;

  if (getAllLiveVideosDto?.keyword) {
    _where['publisher_name'] = {
      [Op.iLike]: `%${getAllLiveVideosDto.keyword.toLowerCase()}%`,
    };
  }

  if (getAllLiveVideosDto?.video_mode)
    _where['video_mode'] =
      LiveVideoModeEnum[getAllLiveVideosDto.video_mode.toLocaleUpperCase()];

  return _where;
};

export const commonAttributes: any = [
  [Sequelize.literal('CAST("LiveVideo"."id" AS INTEGER)'), 'id'],
  [LiveVideo.getLiveVideoRole, 'role'],
  [LiveVideo.getLiveVideoMode, 'video_mode'],
  [LiveVideo.getLiveVideoStreamingRequest, 'streaming_request'],
];
