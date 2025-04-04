import { HttpException, Injectable, InternalServerErrorException, MethodNotAllowedException, NotFoundException } from '@nestjs/common';
import * as Hubspot from '@hubspot/api-client';
import { ConfigService } from '@nestjs/config';
import { Users } from 'src/common/models/users.model';
import { Integrations } from 'src/common/models/integrations.model';
import { INTEGRATION_TYPES } from 'src/common/constants/integrations';
import { Op } from 'sequelize';
import axios from 'axios';
import { HubspotIntegrationDTO } from '../dto/hubspot-integration.dto';
import * as moment from 'moment';
import { CreateFieldProps, HUBSPOT_CATEGORYS, INTEGRATION_OPTION } from 'src/types/integrations';
import { AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/associations/v4';
import { AssociatedId } from 'src/types/enum';
import { authMessages, hubspotMessages, integrationsMessages } from 'src/common/constants/messages';

@Injectable()
export class IntegrationsServiceHubspot {
  private tokenUrl: string
  private adminAccessToken: string

  constructor() {
    const configService = new ConfigService();
    this.adminAccessToken = configService.get('HUBSPOT_ADMIN_ACCESS_TOKEN');
    this.tokenUrl = 'https://api.hubspot.com/oauth/v1/token';
  }

  public async createHubspotEntities(taskProps: CreateFieldProps, companyId: string, integration: INTEGRATION_OPTION): Promise<any> {
    try {
      const hubspot = await Integrations.findOne({
        where: {
          type: INTEGRATION_TYPES.HUBSPOT,
          companyId,
        }
      })

      if (!hubspot?.stageId) {
        return { status: false, message: '', data: {} }
      }

      const access_token = await this.getAccessToken(companyId)
      const hubspotClient = new Hubspot.Client({ accessToken: access_token })

      const hubspot_owner_id = hubspot.hubspot_owner_id
      const hub_id = hubspot.hub_id

      const dealProperties: any = {}
      const contactProperties: any = {}
      const companyProperties: any = {}

      const customFields = hubspot?.customFields
      customFields.forEach(field => {
        if (field.value && field.hubspotCategory === HUBSPOT_CATEGORYS.DEALS && field.integration === integration) {
          if (field.isStaticValue) {
            dealProperties[field.name] = field.value
          } else if (taskProps.hasOwnProperty(field.value)) {
            dealProperties[field.name] = taskProps[field.value as keyof CreateFieldProps]
          }
        }
        else if (field.value && field.hubspotCategory === HUBSPOT_CATEGORYS.CONTACTS && field.integration === integration) {
          if (field.isStaticValue) {
            contactProperties[field.name] = field.value
          } else if (taskProps.hasOwnProperty(field.value)) {
            contactProperties[field.name] = taskProps[field.value as keyof CreateFieldProps]
          }
        }
        else if (field.value && field.hubspotCategory === HUBSPOT_CATEGORYS.COMPANIES && field.integration === integration) {
          if (field.isStaticValue) {
            companyProperties[field.name] = field.value
          } else if (taskProps.hasOwnProperty(field.value)) {
            companyProperties[field.name] = taskProps[field.value as keyof CreateFieldProps]
          }
        }
      })

      if (!contactProperties?.firstname && !companyProperties?.name && !dealProperties?.dealname) {
        return { status: false, message: '', data: null }
      }

      const contact = contactProperties?.firstname || contactProperties?.lastname ? await this.createContactAPI(hubspotClient, { ...contactProperties, hubspot_owner_id }) : null
      const company = companyProperties?.name ? await this.createCompanyAPI(hubspotClient, { ...companyProperties, hubspot_owner_id }) : null
      const deal = dealProperties?.dealname ? await this.createDealAPI(hubspotClient, { ...dealProperties, dealstage: hubspot.stageId, hubspot_owner_id }) : null

      await this.createAssociations(hubspotClient, company?.id, contact?.id, deal?.id);

      return { status: true, message: hubspotMessages.hubspotEntriesCreated, data: { contactId: contact?.id, companyId: company?.id, dealId: deal?.id, hub_id } }
    } catch (err: any) {
      console.error('Error Occurred in createHubspotDeal', { err });
      return { status: false, message: hubspotMessages.hubspotEntriesError(err?.body?.message), data: {} }
    }
  }

  public async updateHubspotEntities(
    taskProps: CreateFieldProps,
    companyId: string,
    integration: INTEGRATION_OPTION,
    hubspotContactId?: string,
    hubspotDealId?: string,
    hubspotCompanyId?: string
  ): Promise<any> {
    try {
      const hubspot = await Integrations.findOne({
        where: {
          type: INTEGRATION_TYPES.HUBSPOT,
          companyId,
        }
      });

      if (!hubspot?.stageId) {
        return { status: false, message: '', data: {} };
      }

      const access_token = await this.getAccessToken(companyId);
      const hubspotClient = new Hubspot.Client({ accessToken: access_token });

      const hubspot_owner_id = hubspot.hubspot_owner_id;
      const dealProperties: any = {};
      const contactProperties: any = {};
      const companyProperties: any = {};

      const customFields = hubspot?.customFields;
      customFields.forEach(field => {
        if (field.value && field.hubspotCategory === HUBSPOT_CATEGORYS.DEALS && field.integration === integration) {
          if (field.isStaticValue) {
            dealProperties[field.name] = field.value;
          } else if (taskProps.hasOwnProperty(field.value)) {
            dealProperties[field.name] = taskProps[field.value as keyof CreateFieldProps];
          }
        }
        else if (field.value && field.hubspotCategory === HUBSPOT_CATEGORYS.CONTACTS && field.integration === integration) {
          if (field.isStaticValue) {
            contactProperties[field.name] = field.value;
          } else if (taskProps.hasOwnProperty(field.value)) {
            contactProperties[field.name] = taskProps[field.value as keyof CreateFieldProps];
          }
        }
        else if (field.value && field.hubspotCategory === HUBSPOT_CATEGORYS.COMPANIES && field.integration === integration) {
          if (field.isStaticValue) {
            companyProperties[field.name] = field.value;
          } else if (taskProps.hasOwnProperty(field.value)) {
            companyProperties[field.name] = taskProps[field.value as keyof CreateFieldProps];
          }
        }
      });

      if (!contactProperties?.firstname && !companyProperties?.name && !dealProperties?.dealname) {
        return { status: false, message: '', data: null }
      }

      const updatedEntities: { [key: string]: string } = {};

      if (hubspotContactId && (contactProperties?.firstname || contactProperties?.lastname)) {
        const contact = await this.updateContactAPI(hubspotClient, hubspotContactId, { ...contactProperties, hubspot_owner_id });
        updatedEntities['contactId'] = contact?.id;
      }

      if (hubspotCompanyId && companyProperties?.name) {
        const company = await this.updateCompanyAPI(hubspotClient, hubspotCompanyId, { ...companyProperties, hubspot_owner_id });
        updatedEntities['companyId'] = company?.id;
      }

      if (hubspotDealId && dealProperties?.dealname) {
        const deal = await this.updateDealAPI(hubspotClient, hubspotDealId, { ...dealProperties, dealstage: hubspot.stageId, hubspot_owner_id });
        updatedEntities['dealId'] = deal?.id;
      }

      return { status: true, message: hubspotMessages.hubspotEntriesUpdated, data: updatedEntities };
    } catch (err: any) {
      console.error(hubspotMessages.hubspotEntriesError, { err });

      return { status: false, message: err?.body?.message ?? hubspotMessages.hubspotEntriesUpdateError(err?.body?.message) ?? err?.response?.message ?? hubspotMessages.hubspotEntriesUpdateError(err?.response?.message), data: {} };
    }
  }

  async createAssociations(hubspotClient: Hubspot.Client, companyId?: string, contactId?: string, dealId?: string) {
    try {
      if (companyId && contactId) {
        await hubspotClient.crm.associations.v4.basicApi.create('companies', companyId, 'contacts', contactId, [
          {
            "associationCategory": AssociationSpecAssociationCategoryEnum.HubspotDefined,
            "associationTypeId": Hubspot.AssociationTypes.companyToContact
          }
        ]);
        console.info('Association created between company and contact');
      }

      if (contactId && dealId) {
        await hubspotClient.crm.associations.v4.basicApi.create('contacts', contactId, 'deals', dealId, [
          {
            "associationCategory": AssociationSpecAssociationCategoryEnum.HubspotDefined,
            "associationTypeId": Hubspot.AssociationTypes.contactToDeal
          }
        ]);
        console.info('Association created between contact and deal');
      }

      if (companyId && dealId) {
        await hubspotClient.crm.associations.v4.basicApi.create('companies', companyId, 'deals', dealId, [
          {
            "associationCategory": AssociationSpecAssociationCategoryEnum.HubspotDefined,
            "associationTypeId": Hubspot.AssociationTypes.companyToDeal
          }
        ]);
        console.info('Association created between company and deal');
      }

      if (dealId && contactId) {
        await hubspotClient.crm.associations.v4.basicApi.create('deals', dealId, 'contacts', contactId, [
          {
            "associationCategory": AssociationSpecAssociationCategoryEnum.HubspotDefined,
            "associationTypeId": Hubspot.AssociationTypes.dealToContact
          }
        ]);
        console.info('Association created between deal and contact');
      }

    } catch (error) {
      console.error(hubspotMessages.hubspotAssociations, error);
    }
  }

  public async getHubspotProperties(companyId: string): Promise<any> {
    try {
      const access_token = await this.getAccessToken(companyId)
      const hubspotClient = new Hubspot.Client({ accessToken: access_token })
      const properties = await this.getPropertiesAPI(hubspotClient)
      const integratedData = await this.getHubspotIntegration(companyId)
      return { messsage: hubspotMessages.hubspotPropertiesFetched, properties, integratedProperties: integratedData.customFields || [] };
    } catch (err) {
      console.error(hubspotMessages.hubspotPropertiesError, err);
    }
  }

  public async getHubspotIntegration(companyId: string) {
    try {
      return await Integrations.findOne({
        where: {
          type: INTEGRATION_TYPES.HUBSPOT,
          companyId,
        },
        attributes: ['pipelineName', 'stageName', 'updatedAt', 'customFields'],
        include: [{
          model: Users,
          attributes: ['name', 'role', 'deletedAt'],
          paranoid: false
        }]

      })
    } catch (err) {
      console.error(hubspotMessages.hubsportIntegrationError, err);
    }
  }

  public async getHubspotHubId(companyId: string) {
    try {
      return await Integrations.findOne({
        where: {
          type: INTEGRATION_TYPES.HUBSPOT,
          companyId,
        },
        attributes: ['hub_id'],
      })
    } catch (err) {
      console.error(hubspotMessages.hubspotIdError, err);
    }
  }

  public async saveHubspotIntegration(user: Users, data: HubspotIntegrationDTO) {
    try {
      const isClickupIntegrated = await Integrations.findOne({
        where: {
          companyId: user.companyId,
          type: INTEGRATION_TYPES.CLICKUP,
          workspaceId: { [Op.not]: null }
        }
      })
      if (isClickupIntegrated) {
        throw new MethodNotAllowedException(integrationsMessages.onlyOneIntegration)
      }

      return await Integrations.update({
        ...data,
        userId: user.id,
      }, {
        where: {
          type: INTEGRATION_TYPES.HUBSPOT,
          companyId: user.companyId,
        }
      })
    } catch (err) {
      console.error(hubspotMessages.hubsportIntegrationError, err);
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new InternalServerErrorException(hubspotMessages.hubsportIntegrationError);
      }
    }
  }

  public async deleteHubspotIntegration(user: Users) {
    try {
      return await Integrations.destroy({
        where: {
          type: INTEGRATION_TYPES.HUBSPOT,
          companyId: user.companyId,
        }
      })
    } catch (err) {
      console.error(hubspotMessages.deleteHubspotIntegrationError, err);
    }
  }

  public async getHubspotPipelines(user: Users, code: string) {
    try {
      const { access_token, refresh_token, expires_in } = await this.exchangeCodeForTokens(code)
      const token_expires_at = this.getTokenExpirationTime(expires_in)
      const hubspotClient = new Hubspot.Client({ accessToken: access_token })
      const { owner_id, hub_id } = await this.getOwnerIdFromAccessToken(hubspotClient)
      await this.createOrUpdateAccessToken(user, access_token, refresh_token, token_expires_at, owner_id, hub_id?.toString())
      const pipelines = await this.getPipelinesAPI(hubspotClient)
      return { pipelines }
    } catch (err: any) {
      console.error(err)
    }
  }

  async exchangeCodeForTokens(code: string): Promise<{ access_token: string, refresh_token: string, expires_in: number }> {
    const configService = new ConfigService();
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', configService.get('HUBSPOT_CLIENT_ID'));
    params.append('client_secret', configService.get('HUBSPOT_CLIENT_SECRET'));
    params.append('redirect_uri', configService.get('HUBSPOT_REDIRECT_URI'));
    params.append('code', code);

    try {
      const response = await axios.post(this.tokenUrl, params);
      return response.data;
    } catch (error) {
      console.error(authMessages.exchangingCodeToken, error);
      throw error;
    }
  }

  async getOwnerIdFromAccessToken(hubspotClient: Hubspot.Client): Promise<{ owner_id: string, hub_id: number } | null> {
    try {
      const accessToken = hubspotClient.config.accessToken;
      const response = await hubspotClient.oauth.accessTokensApi.get(accessToken);
      const owner = await hubspotClient.crm.owners.ownersApi.getById(response.userId, 'userId');
      return { owner_id: owner.id, hub_id: response.hubId }
    } catch (error) {
      console.error(authMessages.ownerIdFromToken, error);
      throw error;
    }
  }

  async createOrUpdateAccessToken(user: Users, access_token: string, refresh_token: string, token_expires_at: string, hubspot_owner_id: string, hub_id: string): Promise<void> {
    try {
      const existingIntegration = await Integrations.findOne({
        where: {
          type: INTEGRATION_TYPES.HUBSPOT,
          companyId: user.companyId,
          access_token: {
            [Op.not]: null
          },
        },
      });

      if (existingIntegration) {
        await existingIntegration.update({ access_token, refresh_token, token_expires_at, userId: user.id, hubspot_owner_id, hub_id });
      } else {
        await Integrations.create({
          access_token,
          refresh_token,
          token_expires_at,
          type: INTEGRATION_TYPES.HUBSPOT,
          companyId: user.companyId,
          userId: user.id,
          hubspot_owner_id,
          hub_id
        });
      }
    } catch (error) {
      console.error(authMessages.createOrUpdateAccessToken, error);

    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ access_token: string, refresh_token: string, expires_in: number }> {
    const configService = new ConfigService();
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', configService.get('HUBSPOT_CLIENT_ID'));
    params.append('client_secret', configService.get('HUBSPOT_CLIENT_SECRET'));
    params.append('refresh_token', refreshToken);
    try {
      const response = await axios.post(this.tokenUrl, params);
      return response.data
    } catch (error) {
      console.error(authMessages.refreshAccessToken, error);
      throw error;
    }
  }

  async getPropertiesAPI(hubspotClient: Hubspot.Client) {
    const importantDealFields = ['dealname', 'description', 'amount', 'closed_lost_reason', 'closed_won_reason', 'dealtype',];
    const importantContactFields = ['firstname', 'lastname', 'city', 'state', 'country', 'email', 'phone', 'website', 'industry', 'jobtitle', 'message'];
    const importantCompanyFields = ['name', 'description', 'domain', 'website', 'phone', 'founded_year', 'city', 'state', 'country', 'timezone', 'address', 'industry'];
    try {
      const dealsResponse = await hubspotClient.crm.properties.coreApi.getAll('deals');
      const contactsResponse = await hubspotClient.crm.properties.coreApi.getAll('contacts');
      const companiesResponse = await hubspotClient.crm.properties.coreApi.getAll('companies');

      const filterProperties = (properties: any[], importantFields: any[]) => {
        return properties.filter(property => importantFields.includes(property.name) || !property.hubspotDefined);
      };

      const filteredDeals = filterProperties(dealsResponse.results, importantDealFields);
      const filteredContacts = filterProperties(contactsResponse.results, importantContactFields);
      const filteredCompanies = filterProperties(companiesResponse.results, importantCompanyFields);

      return { deals: filteredDeals, contacts: filteredContacts, companies: filteredCompanies };
    } catch (error) {
      console.error(hubspotMessages.hubspotPropertiesFetchError, error);
      throw error;
    }
  }

  async createCompanyAPI(hubspotClient: Hubspot.Client, properties: Record<string, any>) {
    try {
      const response = await hubspotClient.crm.companies.basicApi.create({
        properties,
        associations: [],
      });

      // const company = await Workspaces.findOne({ where: { name: properties.name } });
      // company.hubspotCompanyId = response.id;
      // await company.save();

      return response;
    } catch (error) {
      console.error(hubspotMessages.hubspotCompanyError, error);
      throw error;
    }
  }

  async createContactAPI(hubspotClient: Hubspot.Client, properties: Record<string, any>) {
    try {
      const response = await hubspotClient.crm.contacts.basicApi.create({
        properties,
        associations: [],
      });

      // const user = await Users.findOne({ where: { name: `${properties.firstname} ${properties.lastname}` } });
      // user.hubspotContactId = response.id;
      // await user.save();

      return response;
    } catch (error) {
      console.error(hubspotMessages.hubspotContactError, error);
      throw error;
    }
  }

  public async createAdminHubspotEntities(properties: Record<string, any>,
    associatedId?: {
      type: AssociatedId,
      id: string
    }) {
    try {
      if (!this.adminAccessToken) {
        // throw new UnauthorizedException(authMessages.userNotAuthenticated);
        return false
      }

      const hubspotClient = new Hubspot.Client({ accessToken: this.adminAccessToken });
      const contact = properties?.firstname ? await this.createContactAPI(hubspotClient, properties) : null;
      const company = properties?.name ? await this.createCompanyAPI(hubspotClient, properties) : null;

      if (associatedId.type === AssociatedId.COMPANY) await this.createAssociations(hubspotClient, associatedId.id, contact?.id);
      if (associatedId.type === AssociatedId.CONTACT) await this.createAssociations(hubspotClient, company.id, associatedId.id);

      return { status: true, message: hubspotMessages.hubspotAdminEntriesCreated, data: { contactId: contact?.id, companyId: company?.id } }

    } catch (error) {
      console.error(error);
    }
  }

  async createDealAPI(hubspotClient: Hubspot.Client, properties: Record<string, any>) {
    try {
      const response = await hubspotClient.crm.deals.basicApi.create({
        properties,
        associations: [],
      });
      return response;
    } catch (error) {
      console.error(hubspotMessages.hubspotDealError, error);
      throw new InternalServerErrorException(hubspotMessages.hubspotDealError);
    }
  }

  async updateCompanyAPI(hubspotClient: Hubspot.Client, companyId: string, properties: Record<string, any>) {
    try {
      const response = await hubspotClient.crm.companies.basicApi.update(companyId, { properties });
      return response;
    } catch (error) {
      console.error(hubspotMessages.hubspotCompanyUpdateError, error);
      throw new InternalServerErrorException(hubspotMessages.hubspotCompanyUpdateError);
    }
  }

  async updateContactAPI(hubspotClient: Hubspot.Client, contactId: string, properties: Record<string, any>) {
    try {
      const response = await hubspotClient.crm.contacts.basicApi.update(contactId, { properties });
      return response;
    } catch (error) {
      console.error(hubspotMessages.hubspotContactUpdateError, error);
      throw new InternalServerErrorException(hubspotMessages.hubspotContactUpdateError);
    }
  }

  async updateDealAPI(hubspotClient: Hubspot.Client, dealId: string, properties: Record<string, any>) {
    try {
      const response = await hubspotClient.crm.deals.basicApi.update(dealId, { properties });
      return response;
    } catch (error) {
      console.error('Error updating deal:', error);
      throw error;
    }
  }

  async getPipelinesAPI(hubspotClient: Hubspot.Client) {
    try {
      const response = await hubspotClient.crm.pipelines.pipelinesApi.getAll('deals');
      return response.results;
    } catch (error) {
      console.error(hubspotMessages.hubspotPipeLinesError, error);
      throw new InternalServerErrorException(hubspotMessages.hubspotPipeLinesError);
    }
  }

  async getAccessToken(companyId: string) {
    const integration = await Integrations.findOne({
      where: {
        type: INTEGRATION_TYPES.HUBSPOT,
        companyId,
        access_token: { [Op.not]: null },
      }
    })

    if (!integration) throw new NotFoundException(hubspotMessages.hubspotIntegrationNotFound);

    const { access_token, refresh_token, token_expires_at } = integration;

    if (this.isTokenExpired(token_expires_at)) {
      const { access_token: newAccessToken, refresh_token: newRefreshToken, expires_in: newExpiresIn } = await this.refreshAccessToken(refresh_token);
      await integration.update({ access_token: newAccessToken, refresh_token: newRefreshToken, token_expires_at: this.getTokenExpirationTime(newExpiresIn) });
      return newAccessToken;
    }

    return access_token
  }

  private getTokenExpirationTime(expiresIn: number) {
    const currentTime = moment();
    const tokenExpiresAt = currentTime.add(expiresIn, 'seconds').subtract(5, 'seconds'); // As Processing time
    return tokenExpiresAt.toISOString();
  }

  private isTokenExpired(tokenExpiresAt: Date): boolean {
    return moment().isAfter(moment(tokenExpiresAt));
  }

}
