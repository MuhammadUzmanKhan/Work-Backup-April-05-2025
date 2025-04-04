import {
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { LinkedinAccountCompanyDto } from "./dto/linkedin-account-company.dto";
import { LinkedinAccountCompanies } from "src/common/models/linkedin-account-companies.model";
import { linkedinCompanyMessages } from "src/common/constants/messages";

@Injectable()
export class LinkedinAccountCompanyService {
  constructor(
  ) { }
  public async createLinkedinAccountCompany(
    { linkedinAccountCompanyDto }: { linkedinAccountCompanyDto: LinkedinAccountCompanyDto }
  ) {

    const {
      name,
      location,
    } = linkedinAccountCompanyDto;

    try {
      let linkedinAccountCompany = await LinkedinAccountCompanies.findOne({ where: { name, location } })
      if (linkedinAccountCompany) {
        return {
          message: linkedinCompanyMessages.linkedinCompanuAlreadyExist,
          linkedinAccountCompany,
        };
      }
      linkedinAccountCompany = await LinkedinAccountCompanies.create({
        name,
        location,

      });
      return {
        message: linkedinCompanyMessages.linkedinCompanyCreated,
        linkedinAccountCompany,
      };
    } catch (err) {
      console.error("err is........", err)
      throw new InternalServerErrorException(linkedinCompanyMessages.linkedinCompanyCreateError);
    }
  }
}
