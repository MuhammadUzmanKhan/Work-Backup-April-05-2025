import {
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { Institutions } from "src/common/models/institutions.model";
import { InstitutionDto } from "./dto/institution.dto";
import { institutionsMessages } from "src/common/constants/messages";

@Injectable()
export class InstitutionService {
  constructor(
  ) { }
  public async createInstitution({ institutionDto }: { institutionDto: InstitutionDto }) {
    try {
      const { name, } = institutionDto;
      let institution = await Institutions.findOne({ where: { name } })

      if (institution) {
        return {
          message: institutionsMessages.institutionFound,
          institution
        }
      }

      institution = await Institutions.create({ name });
      return {
        message: institutionsMessages.institutionCreated,
        institution,
      };
    } catch (err) {
      console.error(institutionsMessages.institutionCreateError, err)
      throw new InternalServerErrorException(institutionsMessages.institutionCreateError);
    }
  }
}
