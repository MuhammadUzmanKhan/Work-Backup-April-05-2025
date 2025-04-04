import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Experience } from "src/common/models/experience.model";
import { ExperienceEntityDto } from "./dto/experience.dto";
import { experiencesMessages } from "src/common/constants/messages";
// import { experienceDto } from "./dto/experience.dto";

@Injectable()
export class ExperienceService {
  constructor() { }
  public async createExperience({
    experienceDto,
  }: {
    experienceDto: ExperienceEntityDto;
  }) {
    const { duration, title, totalDuration, linkedinAccountId, linkedinAccountCompanyId, createdAt, updatedAt
    } =
      experienceDto;
    let experienceEntity = null
    experienceEntity = await Experience.findOne({ where: { title, linkedinAccountId, linkedinAccountCompanyId } });
    if (experienceEntity) {
      if (
        (experienceEntity.duration !== duration) ||
        (experienceEntity.totalDuration && totalDuration && experienceEntity.totalDuration !== totalDuration)
      ) {
        await Experience.update(
          {
            duration,
            totalDuration,
            updatedAt: new Date()
          },
          {
            where: {
              linkedinAccountId, linkedinAccountCompanyId, title
            }
          }
        );
        return {
          message: experiencesMessages.experienceUpdated,
        }
      } else {
        return {
          message: experiencesMessages.experienceNotChange,
        };
      }
    }
    try {
      experienceEntity = await Experience.create({
        duration,
        title,
        totalDuration,
        linkedinAccountId,
        linkedinAccountCompanyId,
        createdAt,
        updatedAt
      });
      return {
        message: experiencesMessages.experienceCreated,
        experienceEntity,
      };
    } catch (err) {
      console.error("err is........", err);
      throw new InternalServerErrorException(
        experiencesMessages.experienceCreatedError
      );
    }
  }
}
