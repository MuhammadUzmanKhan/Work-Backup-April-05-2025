import * as AgoraDynamicKey2 from 'agora-token';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Sequelize } from 'sequelize-typescript';
import {
  Department,
  Incident,
  IncidentType,
  LiveVideo,
  Location,
  User,
} from '@ontrack-tech-group/common/models';
import {
  hasUserPermission,
  throwCatchError,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  ERRORS,
  Options,
  PolymorphicType,
  RESPONSES,
  SortBy,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';
import { getTimeDifference } from '@Common/helpers';
import {
  LiveVideoModeEnum,
  LiveVideoRoleNumber,
  LiveVideoStreamingRequestEnum,
} from '@Common/constants';
import { commonAttributes, getAllVideosWhere } from './helper';
import {
  CreateLiveVideoDto,
  GenerateTokenDto,
  GetAllLiveVideosDto,
  UpdateLiveVideoDto,
} from './dto';

@Injectable()
export class LiveVideoService {
  constructor(
    private readonly pusherService: PusherService,
    private readonly configService: ConfigService,
    private readonly sequelize: Sequelize,
  ) {}

  async createLiveVideo(createLiveVideoDto: CreateLiveVideoDto, user: User) {
    const { event_id, department_id, location, role } = createLiveVideoDto;
    let liveVideo: LiveVideo;

    await withCompanyScope(user, event_id);

    const department = await Department.findOne({
      where: { id: department_id },
      attributes: ['id'],
    });
    if (!department)
      throw new NotFoundException(RESPONSES.notFound('Department'));

    const transaction = await this.sequelize.transaction();

    try {
      liveVideo = await LiveVideo.create(
        {
          ...createLiveVideoDto,
          role: LiveVideoRoleNumber[role.toUpperCase()],
          user_id: user.id,
        },
        { transaction },
      );

      if (location) {
        await Location.create(
          {
            latitude: location.latitude,
            longitude: location.longitude,
            locationable_id: liveVideo.id,
            locationable_type: PolymorphicType.LIVE_VIDEO,
          },
          { transaction },
        );
      }

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throwCatchError(e);
    }

    const createdLiveVdieo = await this.getLiveVideoById(
      liveVideo.id,
      event_id,
      {
        useMaster: true,
      },
    );

    this.pusherService.sendLiveVideoUpdate(createdLiveVdieo, event_id);

    return createdLiveVdieo;
  }

  async generateToken(generateTokenDto: GenerateTokenDto) {
    const { channel_name, role } = generateTokenDto;
    let { uid } = generateTokenDto;

    try {
      const app_id = this.configService.get('AGORA_APP_ID');
      const app_certificate = this.configService.get('AGORA_APP_CERTIFICATE');

      uid = uid
        ? uid
        : parseInt(
            Math.floor(Math.random() * 1000000)
              .toString()
              .padStart(6, '0'),
            10,
          );

      const user_role = role === 'publisher' ? 1 : 2;

      const token_expiration_in_seconds = 3600;
      const privilege_expire_in_seconds = 3600;

      const agora_token = AgoraDynamicKey2.RtcTokenBuilder.buildTokenWithUid(
        app_id,
        app_certificate,
        channel_name,
        uid,
        user_role,
        token_expiration_in_seconds,
        privilege_expire_in_seconds,
      );

      console.log('Token With Integer Number Uid: ' + agora_token);

      return { uid, agora_token };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getLiveVideoById(id: number, event_id: number, options?: Options) {
    const liveVideo = await LiveVideo.findOne({
      where: { id, event_id },
      attributes: {
        include: [
          ...commonAttributes,
          [
            Sequelize.literal('"incident->incident_types"."name"'),
            'streaming_incident_type',
          ],
        ],
        exclude: ['updatedAt'],
      },
      include: [
        {
          model: Location,
          attributes: ['id', 'latitude', 'longitude', 'created_at'],
        },
        {
          model: Incident,
          attributes: [],
          include: [
            {
              model: IncidentType,
              attributes: [],
            },
          ],
        },
      ],
      ...options,
    });

    if (!liveVideo)
      throw new NotFoundException(RESPONSES.notFound('Live Video'));

    const { streaming_start_at, streaming_end_at } = liveVideo;

    const video_length = getTimeDifference(
      streaming_start_at,
      streaming_end_at,
    );

    return {
      ...liveVideo.toJSON(),
      video_length,
      streaming_incident_type:
        liveVideo['video_type'] !== 'Incident'
          ? null
          : liveVideo.dataValues['streaming_incident_type'],
    };
  }

  async getAllLiveVideos(getAllLiveVideosDto: GetAllLiveVideosDto) {
    const liveVideos = await LiveVideo.findAll({
      where: getAllVideosWhere(getAllLiveVideosDto),
      attributes: {
        include: [
          ...commonAttributes,
          [
            Sequelize.literal('"incident->incident_types"."name"'),
            'streaming_incident_type',
          ],
        ],
        exclude: ['updatedAt'],
      },
      include: [
        {
          model: Location,
          attributes: ['id', 'latitude', 'longitude', 'created_at'],
        },
        {
          model: Incident,
          attributes: [],
          include: [
            {
              model: IncidentType,
              attributes: [],
            },
          ],
        },
      ],
      order: [['createdAt', SortBy.DESC]],
    });

    const videos = liveVideos.map((video) => {
      const video_length = getTimeDifference(
        video.streaming_start_at,
        video.streaming_end_at,
      );

      return {
        ...video.toJSON(),
        video_length,
        streaming_incident_type:
          video['video_type'] !== 'Incident'
            ? null
            : video.dataValues['streaming_incident_type'],
      };
    });

    return videos;
  }

  async updateLiveVideo(
    id: number,
    liveVideoUpdateDto: UpdateLiveVideoDto,
    user: User,
  ) {
    const { event_id, streaming_request, video_mode } = liveVideoUpdateDto;

    // It will check if this user has permission to update live video or not
    const hasPermission = await hasUserPermission(user, [
      UserAccess.LIVE_VIDEO_UPDATE,
    ]);

    const liveVideo = await LiveVideo.findOne({
      where: { id },
      attributes: [
        'id',
        'event_id',
        'video_mode',
        'streaming_request',
        'streaming_start_at',
        'streaming_end_at',
        'user_id',
      ],
    });
    if (!liveVideo)
      throw new NotFoundException(RESPONSES.notFound('Live Video'));

    // If no permission found then only that user can edit basic info of itself created live video and return without performing any action.
    if (!hasPermission && liveVideo.user_id !== user.id)
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);

    if (streaming_request) {
      liveVideo['streaming_request'] =
        LiveVideoStreamingRequestEnum[streaming_request.toUpperCase()];
    }

    if (video_mode) {
      liveVideo['video_mode'] = LiveVideoModeEnum[video_mode.toUpperCase()];

      switch (video_mode) {
        case 'live':
          liveVideo['streaming_start_at'] = new Date();
          break;
        case 'past':
          liveVideo['streaming_end_at'] = new Date();
          break;
      }
    }

    await liveVideo.save();

    const updatedLiveVideo = await this.getLiveVideoById(
      liveVideo.id,
      event_id,
      {
        useMaster: true,
      },
    );

    this.pusherService.sendLiveVideoUpdate(updatedLiveVideo, event_id);

    return updatedLiveVideo;
  }

  async deleteLiveVideo(id: number, user: User) {
    // It will check if this user has permission to delete live video or not
    const hasPermission = await hasUserPermission(user, [
      UserAccess.LIVE_VIDEO_DELETE,
    ]);

    const liveVideo = await LiveVideo.findOne({
      where: { id },
      attributes: ['id', 'user_id'],
    });

    // If no permission found then only that user can edit basic info of itselft created live video and return without performing any action.
    if (!hasPermission && liveVideo.user_id !== user.id)
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);

    if (!liveVideo)
      throw new NotFoundException(RESPONSES.notFound('Live Video'));

    await liveVideo.destroy();

    return { message: 'Live Video Has Been Deleted Successfully' };
  }
}
