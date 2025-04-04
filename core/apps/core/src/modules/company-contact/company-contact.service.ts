import { Injectable, NotFoundException } from '@nestjs/common';
import { Editor, ERRORS, Options } from '@ontrack-tech-group/common/constants';
import { CreateOptions, Op, Transaction, UpdateOptions } from 'sequelize';
import {
  Company,
  CompanyContact,
  User,
} from '@ontrack-tech-group/common/models';
import { CreateCompanyContactDto, UpdateCompanyContactDto } from './dto';

@Injectable()
export class CompanyContactService {
  async createCompanyContact(
    createCompanyContactDto: CreateCompanyContactDto,
    transaction?: Transaction,
    user?: User,
  ) {
    const company = await Company.findByPk(createCompanyContactDto.company_id, {
      attributes: ['id', 'created_by', 'name'],
    });
    if (!company) throw new NotFoundException(ERRORS.COMPANY_NOT_FOUND);

    const companyContact = await CompanyContact.create(
      {
        ...createCompanyContactDto,
      },
      {
        transaction,
        editor: { editor_id: user.id, editor_name: user.name },
      } as CreateOptions & {
        editor: Editor;
      },
    );

    return this.getCompanyContactByCompanyId(companyContact.id, {
      useMaster: true,
    });
  }

  async updateCompanyContact(
    updateCompanyContactDto: UpdateCompanyContactDto,
    user: User,
    transaction?: Transaction,
  ) {
    const company = await Company.findByPk(updateCompanyContactDto.company_id);

    if (!company) throw new NotFoundException(ERRORS.COMPANY_NOT_FOUND);

    const companyContact = await CompanyContact.update(
      { ...updateCompanyContactDto },
      {
        where: { company_id: updateCompanyContactDto.company_id },
        transaction,
        individualHooks: true,
        editor: { editor_id: user.id, editor_name: user.name },
      } as UpdateOptions & {
        editor: Editor;
      },
    );

    return companyContact;
  }

  async getCompanyContactByCompanyId(id: number, options?: Options) {
    return await CompanyContact.findOne({
      where: { company_id: id },
      ...options,
    });
  }
}
