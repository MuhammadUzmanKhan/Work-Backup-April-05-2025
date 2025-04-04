import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Companies } from 'src/common/models/companies.model';
import { ContactExperienceService } from '../contact-experience/contact-experience.service';
import { Users } from 'src/common/models/users.model';
import { Op } from 'sequelize';
import { ContactExperience } from 'src/common/models/contact-experience.model';
import { Contacts } from 'src/common/models/contacts.model';
import { companiesMessages } from 'src/common/constants/messages';

@Injectable()
export class CompaniesService {
    constructor(
        private readonly contactExperienceService: ContactExperienceService,
    ) { }

    public async getAllCompanies(
        {
            user,
            search,
            companySize,
            page = 1,
            perPage = 20,
        }: {
            user: Users,
            search: string,
            companySize: string,
            page: number,
            perPage: number,
        }
    ) {
        try {
            const companiesPerPage = +perPage;
            const offset = (page - 1) * companiesPerPage;

            const companySizes = companySize?.split(',') as string[];

            const whereQuery: any = {
                workspaceId: user.companyId
            };

            if (search) {
                search = search.trim();
                whereQuery[Op.or] = [
                    {
                        name: {
                            [Op.iLike]: `%${search}%`
                        }
                    },
                    {
                        location: {
                            [Op.iLike]: `%${search}%`
                        }
                    },
                    {
                        businessType: {
                            [Op.iLike]: `%${search}%`
                        }
                    },
                    {
                        slug: {
                            [Op.iLike]: `%${search}%`
                        }
                    }
                ]
            }

            if (companySizes?.length) {
                whereQuery.numberOfEmployees = {
                    [Op.in]: companySizes
                }
            }

            const companies = await Companies.findAll(
                {
                    where: whereQuery,
                    attributes: ['id', 'name', 'location', 'foundedYear', 'fundedInfo', 'businessType', 'slug'],
                    limit: companiesPerPage,
                    offset,
                    order: [['createdAt', 'DESC']]
                }
            )

            const totalCompanies = await Companies.count({
                where: whereQuery
            })

            const totalPages = Math.ceil(totalCompanies / companiesPerPage);

            return {
                message: companiesMessages.allCompaniesFetched,
                page,
                companies,
                totalPages,
                companiesPerPage,
                companiesCount: totalCompanies,
            }
        } catch (error: any) {
            console.error(companiesMessages.allCompaniesFetchedError, error)
            throw new InternalServerErrorException(error?.messsage)
        }
    }

    public async getCompanyBySlug(
        user: Users,
        slug: string,
    ): Promise<{
        message: string,
        company?: Companies,
    }> {
        const companyExist = await Companies.findOne({ where: { slug, workspaceId: user.companyId } });
        if (!companyExist) throw new NotFoundException(companiesMessages.companyNotFound);

        const company = await Companies.findOne({
            where: {
                workspaceId: user.companyId,
                slug
            },
            include: [
                {
                    model: Contacts,
                    attributes: ['name', 'email', 'slug'],
                    include: [
                        {
                            model: ContactExperience,
                            attributes: ['duration', 'totalDuration', 'title'],
                            where: {
                                companyId: companyExist.id
                            }
                        }
                    ]
                }
            ],
        })

        return {
            message: companiesMessages.companyByIdFetched,
            company
        }
    }

    public async updateCompanyById(workspaceId: string, companyId: string, companyObj: { name: string, location: string }): Promise<{ message: string, success: boolean, company?: Companies }> {
        try {
            const company = await Companies.findOne({
                where: {
                    workspaceId,
                    id: companyId
                }
            })

            if (!company) {
                return {
                    message: companiesMessages.companyNotFound,
                    success: false,
                }
            }

            await Companies.update({
                name: companyObj.name,
                location: companyObj.location
            }, {
                where: {
                    workspaceId,
                    id: companyId
                }
            })

            return {
                message: companiesMessages.companyUpdated,
                success: true,
                company
            }
        } catch (error: any) {
            console.error(companiesMessages.companyUpdateError, error)
            throw new InternalServerErrorException(error?.messsage)
        }
    }

    public async deleteCompanyById(workspaceId: string, companyId: string): Promise<{ message: string, success: boolean }> {
        try {
            const company = await Companies.findOne({
                where: {
                    workspaceId,
                    id: companyId
                }
            })

            if (!company) {
                return {
                    message: companiesMessages.companyNotFound,
                    success: false,
                }
            }

            await Companies.destroy({
                where: {
                    workspaceId,
                    id: companyId
                }
            })

            return {
                message: companiesMessages.companyDeleted,
                success: true
            }
        } catch (error: any) {
            console.error(companiesMessages.companyDeletedError, error)
            throw new InternalServerErrorException(error?.messsage)
        }
    }

    public async createOrFindContactCompany(
        workspaceId: string,
        contactId: string,
        companyName: string,
        location?: string,
        experienceObj?: { duration: string, totalDuration: string, title: string }
    ): Promise<{ message: string, success: boolean, company?: Companies }> {
        try {
            if (!companyName) {
                return {
                    message: companiesMessages.companyInformationNotFound,
                    success: false,
                }
            }

            let company = await Companies.findOne({
                where: {
                    workspaceId,
                    name: companyName,
                    ...(location && { location })
                }
            })

            if (company) {
                const contactExperience = await this.contactExperienceService.getExperienceByContactIdCompanyId(contactId, company.id, experienceObj?.title)
                if (contactExperience) await this.contactExperienceService.updateExperienceByContactIdCompanyId(contactId, company.id, experienceObj?.duration, experienceObj?.totalDuration, experienceObj?.title)
                else await this.contactExperienceService.createExperienceByContactIdCompanyId(contactId, company.id, experienceObj?.duration, experienceObj?.totalDuration, experienceObj?.title)

                return {
                    message: companiesMessages.companyFoundContactLinked,
                    success: true,
                    company
                }
            }

            company = await Companies.create({
                workspaceId,
                name: companyName,
                ...(location && { location })
            });

            await this.contactExperienceService.createExperienceByContactIdCompanyId(contactId, company.id, experienceObj?.duration, experienceObj?.totalDuration, experienceObj?.title)
            return {
                message: companiesMessages.companyCreated,
                success: true,
                company
            }
        } catch (error: any) {
            console.error(companiesMessages.companyCreateError, error)
            throw new InternalServerErrorException(error?.messsage)
        }
    }


}
