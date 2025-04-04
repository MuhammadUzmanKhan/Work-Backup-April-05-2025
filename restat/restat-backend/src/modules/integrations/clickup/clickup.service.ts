import { HttpException, Injectable, InternalServerErrorException, MethodNotAllowedException, NotFoundException } from '@nestjs/common';
import { ClickupDTO } from '../dto/clickup.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Integrations } from 'src/common/models/integrations.model';
import { Op } from 'sequelize';
import { CLICKUP_SUB_TYPES, INTEGRATION_TYPES } from 'src/common/constants/integrations';
import { ClickUpIntegrationDTO } from '../dto/clickup-integrate.dto';
import { ClickUpFieldsDTO } from '../dto/clickup-fields-mapping-dto';
import { Users } from 'src/common/models/users.model';
import { Profiles } from 'src/common/models/profiles.model';
import { SOURCE } from 'src/common/constants/source';
import { UpworkProfileDTO } from '../dto/clickup-upwork-profiles-dto';
import { CreateFieldProps } from 'src/types/integrations';
import { authMessages, clickUpMessages, integrationsMessages } from 'src/common/constants/messages';


interface Field {
    id: string;
    name: string;
    type: string;
    type_config?: Record<string, any>;
    date_created?: string;
    hide_from_guests?: boolean;
    required: boolean;
}

interface Member {
    id: number;
    username: string;
    email: string;
    color: string;
    initials: string;
    profilePicture?: string;
}

@Injectable()
export class IntegrationsServiceClickup {
    constructor() { }

    public async getClickUpIntegrations(companyId: string) {
        try {
            const integrations = await Integrations.findAll({
                where: {
                    type: INTEGRATION_TYPES.CLICKUP,
                    listId: { [Op.not]: null },
                    companyId,
                },
                attributes: ['workspaceName', 'spaceName', 'folderName', 'listName', 'status', 'isFolderlessList', 'isSharedHierarchy', 'updatedAt', 'customFields', 'subType'],
                include: [{
                    model: Users,
                    attributes: ['name', 'role', 'deletedAt'],
                    paranoid: false
                }]
            })

            if (!integrations.length) {
                return []
            }

            return integrations
        } catch (err) {
            console.error(clickUpMessages.clickupIntegrationError, err);
        }
    }

    public async getClickUpWorkspaces(user: Users, data: ClickupDTO) {
        try {
            const access_token = await this.getClickUpAccessToken(data.code)
            const teams = await this.getClickUpTeamAPI(access_token)
            const userId = (await this.getClickUpAuthorizedUserAPI(access_token))?.id
            const ownerIds = teams?.flatMap((team: any) => team?.members?.map((member: any) => (member?.user?.id === userId && [1, 2, 3].includes(member?.user?.role)) ? member?.user?.id : null))?.filter(Boolean)
            if (teams?.length) {
                if (ownerIds?.length < teams?.length) {
                    throw new MethodNotAllowedException(clickUpMessages.clickupUnauthorized)
                } else {
                    await this.createOrUpdateAccessToken(user, access_token)
                }

                const spaces = await this.getClickUpSpacesAPI({ teamId: teams[0]?.id, access_token })
                if (spaces?.length) {
                    return {
                        teams,
                        spaces,
                        folders: await this.getClickUpFoldersAPI({ spaceId: spaces[0]?.id, access_token })
                    }
                } else {
                    return {
                        teams,
                        spaces,
                        folders: []
                    }
                }
            } else {
                return { teams, spaces: [], folders: [] }
            }
        } catch (err: any) {
            if (err?.response?.statusCode === 405) {
                throw new MethodNotAllowedException(err.response?.message)
            }
            return { teams: [], spaces: [], folders: [] }
        }
    }

    public async getClickUpSharedHierarchy(companyId: string, workspaceId: string) {
        try {
            const access_token = await this.getAccessToken(companyId)
            let shared = await this.getClickupSharedHierarchyAPI({ workspaceId, access_token })
            return shared
        } catch (err) {
            console.error(clickUpMessages.clickupWorkspaceError, err);
        }
    }

    public async getClickUpSpaces(companyId: string, workspaceId: string) {
        try {
            const access_token = await this.getAccessToken(companyId)
            const spaces = await this.getClickUpSpacesAPI({ teamId: workspaceId, access_token })
            let folders = []
            if (spaces?.length) [
                folders = await this.getClickUpFoldersAPI({ spaceId: spaces[0]?.id, access_token })
            ]
            return {
                spaces,
                folders
            }
        } catch (err) {
            console.error(clickUpMessages.clickupWorkspaceError, err);
        }
    }

    public async getClickUpFolders(companyId: string, spaceId: string) {
        try {
            const access_token = await this.getAccessToken(companyId)
            return await this.getClickUpFoldersAPI({ spaceId, access_token })
        } catch (err) {
            console.error(clickUpMessages.clickupWorkspaceError, err);
        }
    }

    public async getClickUpFolderlessList(companyId: string, spaceId: string) {
        try {
            const access_token = await this.getAccessToken(companyId)
            let folderless = await this.getClickUpFolderlessListAPI({ spaceId, access_token })

            if (folderless?.length) {
                folderless = await Promise.allSettled(folderless?.map(async (list: any) => ({
                    ...list,
                    statuses: (await this.getClickUpListsAPI({ listId: list?.id, access_token }))?.statuses
                })))
            }

            return folderless?.map((promise: any) => promise?.value)
        } catch (err) {
            console.error(clickUpMessages.clickupWorkspaceError, err);
        }
    }

    public async saveClickUpIntegration(user: Users, data: ClickUpIntegrationDTO) {
        try {
            const isHubspotIntegrated = await Integrations.findOne({
                where: {
                    companyId: user.companyId,
                    type: INTEGRATION_TYPES.HUBSPOT,
                    pipelineId: { [Op.not]: null }
                }
            })
            if (isHubspotIntegrated) {
                throw new MethodNotAllowedException(integrationsMessages.onlyOneIntegration)
            }

            return await Integrations.update({
                ...data,
                userId: user.id,
            }, {
                where: {
                    type: INTEGRATION_TYPES.CLICKUP,
                    companyId: user.companyId,
                    subType: data.subType
                }
            })
        } catch (err: any) {
            console.error(clickUpMessages.clickupIntegrationError, err);
            if (err instanceof HttpException) {
                throw err;
            } else {
                throw new InternalServerErrorException(clickUpMessages.clickupIntegrationError);
            }
        }
    }

    public async deleteClickUpIntegration(user: Users) {
        try {
            return await Integrations.destroy({
                where: {
                    type: INTEGRATION_TYPES.CLICKUP,
                    companyId: user.companyId,
                }
            })
        } catch (err) {
            console.error(clickUpMessages.clickupIngrationDeleteError, err);
        }
    }

    public async saveClickUpFields(companyId: string, data: ClickUpFieldsDTO) {
        try {
            const isExists = await Integrations.findOne({
                where: {
                    type: INTEGRATION_TYPES.CLICKUP,
                    subType: data.subType,
                    companyId,
                }
            })

            if (!isExists) throw new NotFoundException(clickUpMessages.clickupIntegrationNotFound)

            return await Integrations.update({
                customFields: data.customFields,
            }, {
                where: {
                    type: INTEGRATION_TYPES.CLICKUP,
                    subType: data.subType,
                    companyId,
                }
            })

        } catch (err) {
            console.error(clickUpMessages.clickupIntegrationError, err);
        }
    }

    public async saveClickupUpworkProfiles(companyId: string, data: UpworkProfileDTO) {
        try {
            const profiles = data.profiles

            Promise.all(profiles.map(async (profile) => {
                await Profiles.update({
                    clickupId: profile.id,
                    clickupUsername: profile.username,
                    clickupEmail: profile.email,
                    clickupProfilePicture: profile.profilePicture
                },
                    { where: { id: profile.profileId, companyId } })
            }))
            return { message: integrationsMessages.profileUpdated }
        } catch (err) {
            console.error(clickUpMessages.clickupIntegrationError, err);
        }
    }

    public async getClickUpFields(companyId: string, listId: string): Promise<any> {
        try {
            const access_token = await this.getAccessToken(companyId)
            let custom_fields = await this.getClickUpCustomFieldsAPI({ listId, access_token })
            let members: Member | [] = []
            let integratedCustomFields: any[] = []

            const usersFieldIndex = custom_fields.findIndex((field: Field) => field.type === 'users')
            if (usersFieldIndex !== -1) {
                const profiles = await Profiles.findAll({ where: { companyId, source: SOURCE.UPWORK } })
                const profile_fields: Field[] = profiles.map(profile => ({ id: profile.id, name: profile.name, type: 'upwork_profile', required: false }))

                // Splitting custom_fields and inserting profile_fields in between
                const firstPart = custom_fields.slice(0, usersFieldIndex + 1)
                const secondPart = custom_fields.slice(usersFieldIndex + 1)
                custom_fields = [...firstPart, ...profile_fields, ...secondPart]

                members = await this.getListMembersAPI({ listId, access_token })
            }

            const integratedDataArray = await this.getClickUpIntegrations(companyId);
            const integratedData = integratedDataArray.find(data => data.listId === listId);

            if (integratedData) {
                integratedCustomFields = integratedData.customFields;
            }

            return { custom_fields, members, integratedCustomFields }
        } catch (err) {
            console.error(clickUpMessages.clickupGetFieldError, err);
        }
    }

    public async saveClickUpProfileInfo(userId: string, code: string) {
        try {
            const access_token = await this.getClickUpAccessToken(code)
            const user = await this.getClickUpAuthorizedUserAPI(access_token)
            await Users.update({
                clickupId: user?.id,
                clickupUsername: user?.username,
                clickupEmail: user?.email,
                clickupProfilePicture: user?.profilePicture
            }, { where: { id: userId } })

            return { sucess: true, message: clickUpMessages.clickupProfileConnected, clickupUser: user }
        } catch (err) {
            console.error(clickUpMessages.clickupProfileError, err);
        }
    }

    public async getClickUpProfileInfo(userId: string) {
        try {
            const clickupUser = await Users.findByPk(userId, { attributes: ['clickupId', 'clickupUsername', 'clickupEmail', 'clickupProfilePicture'] })
            return { sucess: true, message: clickUpMessages.clickupProfileConnected, clickupUser }
        } catch (err) {
            console.error(clickUpMessages.clickupProfileError, err);
        }
    }

    async getListMembersAPI({ listId, access_token }: { listId: string, access_token: string }) {
        try {
            const resp = await axios.get(
                `https://api.clickup.com/api/v2/list/${listId}/member`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: access_token
                    }
                }
            );


            return (resp.data?.members ?? [])?.sort((a: Member, b: Member) => a?.username?.localeCompare(b?.username))
        } catch (error) {
            console.error('Error occurred in getListMembersAPI:', error);
        }
    }

    async getClickUpCustomFieldsAPI({ listId, access_token }: { listId: string, access_token: string }) {
        try {
            const resp = await axios.get(
                `https://api.clickup.com/api/v2/list/${listId}/field`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: access_token
                    }
                }
            );

            const allowed_types = ['text', 'number', 'currency', 'short_text', 'email', 'date', 'users', 'emoji', 'url', 'checkbox']
            return (resp.data?.fields ?? []).filter((field: Field) => allowed_types.includes(field.type)).sort((a: Field, b: Field) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error(clickUpMessages.clickUpCustomFieldsAPI, error);
        }
    }

    async getClickUpFoldersAPI({ spaceId, access_token }: { spaceId: string, access_token: string }) {
        const query = new URLSearchParams({ archived: 'false' }).toString();
        try {
            const response = await axios.get(
                `https://api.clickup.com/api/v2/space/${spaceId}/folder?${query}`,
                {
                    headers: {
                        Authorization: access_token
                    }
                }
            );
            return response.data?.folders ?? []
        } catch (error) {
            console.error(clickUpMessages.clickUpCustomFolderAPI, error);
        }
    }

    async getClickUpFolderlessListAPI({ spaceId, access_token }: { spaceId: string, access_token: string }) {
        const query = new URLSearchParams({ archived: 'false' }).toString();
        try {
            const response = await axios.get(
                `https://api.clickup.com/api/v2/space/${spaceId}/list?${query}`,
                {
                    headers: {
                        Authorization: access_token
                    }
                }
            );
            return response.data?.lists ?? []
        } catch (error) {
            console.error(clickUpMessages.clickupFolderlessListAPI, error);
        }
    }

    async getClickupSharedHierarchyAPI({ workspaceId, access_token }: { workspaceId: string, access_token: string }) {
        try {
            const response = await axios.get(
                `https://api.clickup.com/api/v2/team/${workspaceId}/shared`,
                {
                    headers: {
                        Authorization: access_token
                    }
                }
            );

            return response.data?.shared ?? {
                tasks: [],
                lists: [],
                folders: []
            }
        } catch (error) {
            console.error(clickUpMessages.clickupSharedHierarchyAPI, error);
        }
    }

    async getClickUpListsAPI({ listId, access_token }: { listId: string, access_token: string }) {
        try {
            const query = new URLSearchParams({ archived: 'false' }).toString();
            const response = await axios.get(
                `https://api.clickup.com/api/v2/list/${listId}?query=${query}`,
                {
                    headers: {
                        Authorization: access_token
                    }
                }
            );
            return response.data
        } catch (error) {
            console.error(clickUpMessages.clickUpListsAPI, error);
        }
    }

    async getClickUpSpacesAPI({ teamId, access_token }: { teamId: string, access_token: string }) {
        try {
            const query = new URLSearchParams({ archived: 'false' }).toString();
            const response = await axios.get(
                `https://api.clickup.com/api/v2/team/${teamId}/space?${query}`,
                {
                    headers: {
                        Authorization: access_token
                    }
                }
            );
            return response.data?.spaces ?? []
        } catch (error) {
            console.error(clickUpMessages.clickUpSpacesAPI, error);
            return []
        }
    }

    async getClickUpTeamAPI(access_token: string) {
        try {
            const resp = await axios.get(
                'https://api.clickup.com/api/v2/team',
                {
                    headers: {
                        Authorization: access_token
                    }
                }
            );
            return resp.data?.teams ?? []
        } catch (error) {
            console.error(clickUpMessages.clickUpTeamAPI, error);
            return []
        }
    }

    async getClickUpAuthorizedUserAPI(access_token: string) {
        try {
            const resp = await axios.get(
                'https://api.clickup.com/api/v2/user',
                {
                    headers: {
                        Authorization: access_token
                    }
                }
            );
            return resp.data?.user ?? {}
        } catch (error) {
            console.error(clickUpMessages.clickUpAuthorizedUserAPI, error);
            return {}
        }
    }

    async getClickUpAccessToken(code: string) {
        try {
            const configService = new ConfigService();
            const params = new URLSearchParams({
                client_id: configService.get('CLICKUP_CLIENT_ID'),
                client_secret: configService.get('CLICKUP_CLIENT_SECRET'),
                code,
            });

            const resp = await axios.post(
                'https://api.clickup.com/api/v2/oauth/token',
                params
            );

            const access_token = resp.data?.access_token ?? ""
            return access_token
        } catch (error) {
            // console.error('Error Occurred in getClickUpAccessToken:', error);
        }
    }

    async createOrUpdateAccessToken(user: Users, access_token: string): Promise<void> {
        try {
            const existingIntegrationForDeals = await Integrations.findOne({
                where: {
                    type: INTEGRATION_TYPES.CLICKUP,
                    subType: CLICKUP_SUB_TYPES.DEALS,
                    companyId: user.companyId,
                    access_token: {
                        [Op.not]: null
                    },
                },
            });

            const existingIntegrationForContacts = await Integrations.findOne({
                where: {
                    type: INTEGRATION_TYPES.CLICKUP,
                    subType: CLICKUP_SUB_TYPES.CONTACTS,
                    companyId: user.companyId,
                    access_token: {
                        [Op.not]: null
                    },
                },
            });

            if (existingIntegrationForDeals) {
                await existingIntegrationForDeals.update({ access_token, userId: user.id });
            } else {
                await Integrations.create({
                    access_token,
                    type: INTEGRATION_TYPES.CLICKUP,
                    subType: CLICKUP_SUB_TYPES.DEALS,
                    companyId: user.companyId,
                    userId: user.id,
                });
            }

            if (existingIntegrationForContacts) {
                await existingIntegrationForContacts.update({ access_token, userId: user.id });
            } else {
                await Integrations.create({
                    access_token,
                    type: INTEGRATION_TYPES.CLICKUP,
                    subType: CLICKUP_SUB_TYPES.CONTACTS,
                    companyId: user.companyId,
                    userId: user.id,
                });
            }
        } catch (error) {
            console.error(authMessages.accessTokenError, error);

        }
    }

    async getAccessToken(companyId: string) {
        const access_token = (await Integrations.findOne({
            where: {
                type: INTEGRATION_TYPES.CLICKUP,
                companyId,
                access_token: { [Op.not]: null },
            }
        })).access_token

        if (!access_token) throw new NotFoundException(authMessages.accessTokenNotFound)

        return access_token
    }

    public async createClickUpTask({ priority = 3, assignees, notify_all, tags, ...taskProps }: CreateFieldProps, companyId: string, subType: string = CLICKUP_SUB_TYPES.DEALS) {
        try {
            const clickUp = await Integrations.findOne({
                where: {
                    type: INTEGRATION_TYPES.CLICKUP,
                    subType,
                    companyId,
                }
            })

            if (!clickUp) {
                return { status: false, message: '', data: {} }
            }

            const customFields = clickUp?.customFields
            const access_token = clickUp?.access_token
            const listId = clickUp?.listId;
            if (!listId) {
                return { status: false, message: clickUpMessages.clickupIntegrationNotFound, data: {} }
            }
            const query = new URLSearchParams({
                custom_task_ids: 'true',
                team_id: clickUp.workspaceId
            }).toString();

            const fields = {}
            const custom_fields: { id: string, value: string }[] = []
            customFields.forEach(field => {
                if (!field.isBlank && taskProps.hasOwnProperty(field.value)) {
                    if (field.isStaticField) {
                        //@ts-ignore
                        fields[field.key] = taskProps[field.value]
                    } else {
                        custom_fields.push({
                            id: field.key,
                            //@ts-ignore
                            value: taskProps[field.value]
                        })
                    }
                }
            })

            const response = await axios.post(
                `https://api.clickup.com/api/v2/list/${listId}/task?${query}`,
                {
                    priority,
                    assignees,
                    notify_all,
                    tags,
                    ...fields,
                    custom_fields,
                    status: clickUp.status,
                    check_required_custom_fields: false,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: access_token
                    }
                }
            );
            return { status: true, message: clickUpMessages.clickupTaskCreated, data: response.data }
        } catch (error: any) {
            console.error(clickUpMessages.clickupTaskError(''), error);
            if (error?.response?.data?.ECODE === 'ACCESS_067') {
                return { status: false, message: clickUpMessages.clickupTaskError(error?.response?.data?.err), data: error }
            }
            return { status: false, message: clickUpMessages.clickupTaskError(error?.response?.data?.err), data: error }
        }
    }

    public async updateClickUpTask(taskProps: CreateFieldProps, companyId: string, taskId: string, subType: string = CLICKUP_SUB_TYPES.DEALS) {
        try {
            const clickUp = await Integrations.findOne({
                where: {
                    type: INTEGRATION_TYPES.CLICKUP,
                    subType,
                    companyId,
                }
            })

            if (!clickUp) {
                return { status: false, message: '', data: {} }
            }

            const customFields = clickUp?.customFields
            const access_token = clickUp?.access_token
            const listId = clickUp?.listId;
            if (!listId) {
                return { status: false, message: '', data: {} }
            }
            const query = new URLSearchParams({
                custom_task_ids: 'true',
                team_id: clickUp.workspaceId
            }).toString();

            const fields = {}
            const custom_fields: { id: string, value: string }[] = []
            customFields.forEach(field => {
                if (!field.isBlank && taskProps.hasOwnProperty(field.value)) {
                    if (field.isStaticField) {
                        //@ts-ignore
                        fields[field.key] = taskProps[field.value]
                    } else {
                        custom_fields.push({
                            id: field.key,
                            //@ts-ignore
                            value: taskProps[field.value]
                        })
                    }
                }
            })

            const response = await axios.put(
                `https://api.clickup.com/api/v2/task/${taskId}?${query}`,
                {
                    ...fields,
                    custom_fields,
                    status: clickUp.status,
                    check_required_custom_fields: false,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: access_token
                    }
                }
            );

            const customFieldsPormise = custom_fields.map((field) => {
                return axios.post(
                    `https://api.clickup.com/api/v2/task/${taskId}/field/${field.id}?${query}`,
                    { value: field.value },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: access_token
                        }
                    }
                );
            })

            await Promise.allSettled(customFieldsPormise)

            return { status: true, message: clickUpMessages.clickupTaskSynced, data: response.data }
        } catch (error: any) {
            console.error('Error occurred in updateClickUpTask:', error);
            if (error?.response?.data?.ECODE === 'ACCESS_067') {
                return { status: false, message: clickUpMessages.clickupTaskError(error?.response?.data?.err), data: error }
            }
            return { status: false, message: clickUpMessages.clickupTaskError(error?.response?.data?.err), data: error }
        }
    }

}
