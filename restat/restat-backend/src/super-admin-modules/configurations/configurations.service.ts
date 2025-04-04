import { Inject, Injectable } from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';
import { Configurations } from 'src/common/models/configurations.model';
import { ConfigurationDto } from './dto/configuration.dto';
import { ROLES } from 'src/common/constants/roles';
import { configurationsMessages } from 'src/common/constants/messages';

@Injectable()
export class ConfigurationsService {

    constructor(@Inject('SEQUELIZE') private readonly sequelize?: Sequelize) { }

    public async createGlobalConfiguration() {
        const configuration = await Configurations.findOne({
            where: {
                companyId: null
            }
        });

        if (!configuration) {
            await Configurations.create({
                dashboard: true,
                settings: true,
                clickUp: true,
                hubSpot: true,
                upwork: true,
                companies: true,
                stripe: true,
                upworkProfiles: true,
                businessData: true,
                team: true,
                contacts: true,
                contactUs: true,
                deals: true,
                portfolios: true,
            });
        }
    }

    public async getGlobalConfiguration() {
        return await Configurations.findOne({
            attributes: [
                "id",
                "companyId",
                [
                    Sequelize.literal(`JSON_BUILD_OBJECT(
                      'clickUp', "clickUp",
                      'hubSpot', "hubSpot",
                      'upwork', "upwork",
                        'stripe', "stripe",
                      'dashboard', "dashboard",
                      'settings', "settings",
                      'upworkProfiles', "upworkProfiles",
                      'businessData', "businessData",
                      'companies', "companies",
                      'team', "team",
                      'contacts', "contacts",
                      'contactUs', "contactUs",
                      'deals', "deals",
                      'portfolios', "portfolios"
                    )`),
                    "features",
                ],
            ],
            where: {
                companyId: {
                    [Op.eq]: null
                }
            }
        })
    }

    public async updateConfiguration(id: string, configurationDto: ConfigurationDto) {

        const configuration = await Configurations.findOne({
            where: {
                id
            }
        });

        if (!configuration) {
            throw new Error(configurationsMessages.configurationNotFound);
        }

        await Configurations.update({
            dashboard: configurationDto?.features?.dashboard ?? configuration.dashboard,
            settings: configurationDto?.features?.settings ?? configuration.settings,
            clickUp: configurationDto?.features?.clickUp ?? configuration.clickUp,
            hubSpot: configurationDto?.features?.hubSpot ?? configuration.hubSpot,
            upwork: configurationDto?.features?.upwork ?? configuration.upwork,
            stripe: configurationDto?.features?.stripe ?? configuration.stripe,
            upworkProfiles: configurationDto?.features?.upworkProfiles ?? configuration.upworkProfiles,
            businessData: configurationDto?.features?.businessData ?? configuration.businessData,
            companies: configurationDto?.features?.companies ?? configuration.companies,
            team: configurationDto?.features?.team ?? configuration.team,
            contacts: configurationDto?.features?.contacts ?? configuration.contacts,
            contactUs: configurationDto?.features?.contactUs ?? configuration.contactUs,
            deals: configurationDto?.features?.deals ?? configuration.deals,
            portfolios: configurationDto?.features?.portfolios ?? configuration.portfolios,
        }, {
            where: {
                id
            }
        })

        //logoout all the company users on configuration update
        await this.sequelize.query(`
            DELETE FROM sessions
            USING users
            WHERE sessions."userId" = users."id"
            AND users."role" <> :role
            AND sessions."deletedAt" IS NULL
            `, { replacements: { role: ROLES.SUPER_ADMIN } })


        return { message: configurationsMessages.configurationUpdated }
    }
}
