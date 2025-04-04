import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { EducationEntityDto } from "./dto/education.dto";
import { ContactEducation } from "src/common/models/contact-education.model";
import { educationMessages } from "src/common/constants/messages";

@Injectable()
export class EducationService {

  public async createEducation({ educationDto }: { educationDto: EducationEntityDto }) {
    try {
      const { contactId, institutionId, duration, degree } = educationDto;

      let education: ContactEducation = await ContactEducation.findOne({
        where: { contactId, institutionId, degree },
      });

      if (education) {
        if (education.duration !== duration) {
          education.update({ duration })
          return {
            message: educationMessages.educationUpdated,
          };

        } else {
          return {
            message: educationMessages.educationNotChange,
          };
        }
      }

      education = await ContactEducation.create({
        contactId,
        institutionId,
        duration,
        degree
      });

      return {
        message: educationMessages.educationCreated,
        education,
      };
    } catch (err) {
      console.error(educationMessages.educationCreatedError, err);
      throw new InternalServerErrorException(err);
    }
  }
}
