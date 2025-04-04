import { BID_TYPES } from "./bids";

const accountsMessages = {
    allAccountsFetched: 'All accounts have been fetched successfully.',
    allAccountsFetchedError: 'An error occurred while fetching all accounts.',
    accountByIdFetched: 'The account has been fetched successfully.',
    accountUpdated: 'The account has been updated successfully.',
    accountStateFetched: 'The account state has been fetched successfully.',
    accountStateError: 'An error occurred while fetching the account state.',
    accountAlreadyExist: 'It looks that you already have an account, please try login instead. If you face any difficulty, please contact us by clicking the button below.'
}


const authMessages = {
    userAuthenticated: 'User has been authenticated successfully.',
    userAuthenticationError: 'An error occurred while authenticating the user.',
    userNotAuthenticated: 'User is not authorized.',
    accessTokenCreated: 'Access token has been created successfully.',
    accessTokenError: 'An error occurred while creating the access token.',
    refreshTokenCreated: 'Refresh token has been created successfully.',
    refreshTokenError: 'An error occurred while creating the refresh token.',
    accessTokenNotFound: 'Access token not found.',
    refreshTokenNotFound: 'Refresh token not found.',
    permissionDenied: 'Permission denied.',
    exchangingCodeToken: 'An error occurred while exchanging code for token.',
    ownerIdFromToken: 'An error occurred while retrieving owner ID from token.',
    createOrUpdateAccessToken: 'An error occurred while creating or updating the access token.',
    refreshAccessToken: 'An error occurred while refreshing the access token.',
    userNotFound: 'User not found.',
    tokenExpired: 'Session has expired. Please log in again.',
}


const bidsMessages = {
    allBidsFetched: (type: string) => {
        return type ? `${type === BID_TYPES.ALL ? 'Deals' : type} have been fetched successfully.` : 'All deals have been fetched successfully.';
    },
    allBidsFetchedError: 'An error occurred while fetching all bids.',
    getAllBids: 'All bids have been fetched successfully.',
    bidByIdFetched: 'The bid has been fetched successfully.',
    bidUpdated: 'The bid has been updated successfully.',
    bidUpdateError: 'An error occurred while updating the bid.',
    dealNotFound: 'The deal was not found.',
    bidsCountFetched: 'All stats have been fetched successfully.',
    bidsCountError: 'An error occurred while fetching all stats.',
    bidExists: 'The proposal already exists.',
    proposalSynced: 'The proposal has been synced successfully.',
    proposalSyncError: 'An error occurred while creating the proposal.',
    leadSynced: 'The lead has been synced successfully.',
    bidResponseNotFound: 'The bid response was not found.',
    bidNotFound: 'The bid was not found.',
    bidFound: 'The bid was found.',
    contractedSynced: 'The contract has been synced successfully.',
    biddersJobdsIdFetched: 'The bidders\' job IDs have been fetched successfully.',
    biddersJobIdsError: 'An error occurred while fetching the bidders\' job IDs.',
    companysJobIdsFetched: 'The company job IDs have been fetched successfully.',
    companysJobIdsError: 'An error occurred while fetching the company job IDs.',
    bidDeleted: 'The bid has been deleted successfully.',
    jobNotFound: 'The job was not found.',
}

const logsMessages = {
    allLogsFetched: 'All logs have been fetched successfully.',
    allLogsFetchedError: 'An error occurred while fetching all logs.',
    dealLogCreated: 'The deal log has been created successfully.',
    accountLogCreated: 'The account log has been created successfully.',
    logCreatedError: 'An error occurred while creating the log.',
    logByIdFetched: 'The log has been fetched successfully.',
    proposalLogCreated: 'The proposal has been synced successfully.',
}


const clickUpMessages = {
    clickUpTaskCreated: 'The ClickUp task has been created successfully.',
    clickUpTaskError: 'An error occurred while creating the ClickUp task.',
    clickUpTaskCreatedById: (id: string) => {
        return id ? `A ClickUp task has been created with ID '${id}'.` : 'A ClickUp task has been created successfully.';
    },
    clickupTaskNotCreatedForBid: 'A ClickUp task has not been created for this bid.',
    clickupTaskAlreadyExists: (id: string) => {
        return id ? `A task already exists on ClickUp with the ID '${id}'.` : 'A task has already been created on ClickUp.';
    },
    clickupIntegration: 'The ClickUp integration has been completed successfully.',
    clickupIntegrationNotFound: 'The ClickUp integration was not found.',
    clickupIntegrationError: 'An error occurred in the ClickUp integration.',
    clickupUnauthorized: 'You are not authorized to integrate ClickUp with Restat. Only owners and admins of workspaces can perform integrations.',
    clickupWorkspaceError: 'An error occurred while fetching the ClickUp workspace.',
    clickupIngrationDeleted: 'The ClickUp integration has been deleted successfully.',
    clickupIngrationDeleteError: 'An error occurred while deleting the ClickUp integration.',
    clickupProfileConnected: 'The ClickUp profile has been connected successfully.',
    clickupProfileError: 'An error occurred while saving the ClickUp profile.',
    clickupGetFieldError: 'An error occurred while fetching the ClickUp fields.',
    clickUpCustomFieldsAPI: 'An error occurred while fetching the ClickUp custom fields.',
    clickUpCustomFolderAPI: 'An error occurred while fetching the ClickUp custom folders.',
    clickupFolderlessListAPI: 'An error occurred while fetching the ClickUp folderless list.',
    clickupListNotFound: 'The ClickUp list was not found.',
    clickupSharedHierarchyAPI: 'An error occurred while fetching the ClickUp shared hierarchy.',
    clickUpListsAPI: 'An error occurred while fetching the ClickUp lists.',
    clickUpSpacesAPI: 'An error occurred while fetching the ClickUp spaces.',
    clickUpTeamAPI: 'An error occurred while fetching the ClickUp team.',
    clickUpAuthorizedUserAPI: 'An error occurred while fetching the ClickUp authorized user.',
    clickupTaskCreated: 'The ClickUp task has been created successfully.',
    clickupTaskSynced: 'The ClickUp task has been synced successfully.',
    clickupTaskError: (error: string) => {
        return error ? `An error occurred while creating the ClickUp task: ${error}` : 'An error occurred while creating the ClickUp task.';
    },
}


const integrationsMessages = {
    onlyOneIntegration: 'You can integrate with only one platform at a time. Please choose either HubSpot or ClickUp.',
    integrationError: 'An error occurred while integrating.',
    profileUpdated: 'The profile has been updated successfully.',
}


const hubspotMessages = {
    hubspotContactCreated: 'The HubSpot contact has been created successfully.',
    hubspotContactError: 'An error occurred while creating the HubSpot contact.',
    hubspotContactUpdated: 'The HubSpot contact has been updated successfully.',
    hubspotContactUpdateError: 'An error occurred while updating the HubSpot contact.',
    hubspotContactCreatedById: (id: string) => {
        return id ? `The HubSpot contact has been created successfully with ID ${id}.` : 'The HubSpot contact has been created successfully.';
    },
    hubspotbyIdAlreadyExists: (id: string) => {
        return id ? `A HubSpot deal already exists with ID '${id}'.` : 'The deal has already been created on HubSpot.';
    },
    hubspotNotCreatedForBid: 'The HubSpot contact has not been created for this bid.',
    hubspotIntegrationNotFound: 'The HubSpot integration was not found.',
    hubsportIntegrationError: 'An error occurred in the HubSpot integration.',
    hubspotIntegration: 'The HubSpot integration has been completed successfully.',
    deleteHubspotIntegration: 'The HubSpot integration has been deleted successfully.',
    deleteHubspotIntegrationError: 'An error occurred while deleting the HubSpot integration.',
    hubspotIdError: 'An error occurred while fetching the HubSpot ID.',
    hubspotEntriesCreated: 'The HubSpot entries have been created successfully.',
    hubspotEntriesError: (error: string) => {
        return error ? `An error occurred while creating HubSpot entries: ${error}` : 'An error occurred while creating HubSpot entries.';
    },
    hubspotEntriesUpdated: 'The HubSpot entries have been updated successfully.',
    hubspotEntriesUpdateError: (error: string) => {
        return error ? `An error occurred while updating HubSpot entries: ${error}` : 'An error occurred while updating HubSpot entries.';
    },
    hubspotAssociations: 'The HubSpot associations have been created successfully.',
    hubspotPropertiesFetched: 'The HubSpot properties have been fetched successfully.',
    hubspotPropertiesError: 'An error occurred while fetching HubSpot properties.',
    hubspotPropertiesFetchError: 'An error occurred while fetching HubSpot properties.',
    hubspotCompanyCreated: 'The HubSpot company has been created successfully.',
    hubspotCompanyError: 'An error occurred while creating the HubSpot company.',
    hubspotCompanyUpdated: 'The HubSpot company has been updated successfully.',
    hubspotCompanyUpdateError: 'An error occurred while updating the HubSpot company.',
    hubspotAdminEntriesCreated: 'The HubSpot admin entries have been created successfully.',
    hubspotAdminEntriesError: 'An error occurred while creating the HubSpot admin entries.',
    hubspotDealCreated: 'The HubSpot deal has been created successfully.',
    hubspotDealError: 'An error occurred while creating the HubSpot deal.',
    hubspotPipeLinesFetched: 'The HubSpot pipelines have been fetched successfully.',
    hubspotPipeLinesError: 'An error occurred while fetching HubSpot pipelines.',
}


const contactsMessages = {
    allContactsFetched: 'All contacts have been fetched successfully.',
    allContactsFetchedError: 'An error occurred while fetching all contacts.',
    contactByIdFetched: 'The contact has been fetched successfully.',
    contactByIdFetchedError: 'An error occurred while fetching the contact by ID.',
    contactUpdated: 'The contact has been updated successfully.',
    contactUpdateError: 'An error occurred while updating the contact.',
    contactNotFound: 'The contact was not found.',
    contactFound: 'The contact has been found.',
    contactCreated: 'The contact has been created successfully.',
    contactCreatedError: 'An error occurred while creating the contact.',
    contactExcel: 'The contact Excel file has been created successfully.',
    contactExcelError: 'An error occurred while creating the contact from Excel.',
}


const commentsMessages = {
    allCommentsFetched: 'All comments have been fetched successfully.',
    allCommentsFetchedError: 'An error occurred while fetching all comments.',
    commentByIdFetched: 'The comment has been fetched successfully.',
    commentUpdated: 'The comment has been updated successfully.',
    commentNotFound: 'The comment was not found.',
    commentCreated: 'The comment has been created successfully.',
    commentDeleted: 'The comment has been deleted successfully.',
}


const companiesMessages = {
    allCompaniesFetched: 'All companies have been fetched successfully.',
    allCompaniesFetchedError: 'An error occurred while fetching all companies.',
    companyByIdFetched: 'The company has been fetched successfully.',
    companyUpdated: 'The company has been updated successfully.',
    companyUpdateError: 'An error occurred while updating the company.',
    companyNotFound: 'The company was not found.',
    companyDeleted: 'The company has been deleted successfully.',
    companyDeletedError: 'An error occurred while deleting the company.',
    companyInformationNotFound: 'Company information was not found.',
    companyFoundContactLinked: 'The company has been found, and the contact has been linked.',
    companyCreated: 'The company has been created successfully.',
    companyCreateError: 'An error occurred while creating the company.',
    companyAlreadyExists: 'The company already exists.',
    companyOwnerCannotBeDeleted: 'The company owner cannot be deleted.',
    deleteWorkspace: 'The workspace has been deleted successfully.',
    onlyOwnerCanDeleteWorkspace: 'Only the owner can delete the workspace.',
    deleteWorkspaceError: 'An error occurred while deleting the workspace.',
    deleteWorkspaceScheduled: 'The workspace deletion has been scheduled successfully for 30 days.',
}


const educationMessages = {
    educationUpdated: 'The education has been updated successfully.',
    educationUpdatedError: 'An error occurred while updating the education.',
    educationCreated: 'The education has been created successfully.',
    educationCreatedError: 'An error occurred while creating the education.',
    educationNotChange: 'The education duration remains the same. No update is required.',
}


const errorsMessages = {
    errorCreated: 'The error has been created successfully.',
    errorCreatingError: 'An issue occurred while creating the error.',
    errorRetrievedError: 'An issue occurred while retrieving the errors.',
}


const experiencesMessages = {
    experienceUpdated: 'The experience has been updated successfully.',
    experienceUpdatedError: 'An error occurred while updating the experience.',
    experienceCreated: 'The experience has been created successfully.',
    experienceCreatedError: 'An error occurred while creating the experience.',
    experienceNotChange: 'The experience duration remains the same. No update is required.',
}


const industriesMessages = {
    allIndustriesFetched: 'All industries have been fetched successfully.',
    allIndustriesFetchedError: 'An error occurred while fetching all industries.',
    industryByIdFetched: 'The industry has been fetched successfully.',
    industryUpdated: 'The industry has been updated successfully.',
    industryUpdateError: 'An error occurred while updating the industry.',
    industryDeleted: 'The industry has been deleted successfully.',
    industryDeletedError: 'An error occurred while deleting the industry.',
    industryNotFound: 'The industry was not found.',
    industryExists: 'The industry already exists.',
    industryCreated: 'The industry has been created successfully.',
    industryCreateError: 'An error occurred while creating the industry.',
}


const institutionsMessages = {
    institutionFound: 'The institution has been found.',
    institutionCreated: 'The institution has been created successfully.',
    institutionCreateError: 'An error occurred while creating the institution.',
}

const invitationsMessages = {
    invitationCreated: 'The invitation has been created successfully.',
    invitationCreateError: 'An error occurred while creating the invitation.',
    invitationUpdated: 'The invitation has been updated successfully.',
    invitationUpdateError: 'An error occurred while updating the invitation.',
    invitationDeleted: 'The invitation has been deleted successfully.',
    invitationDeleteError: 'An error occurred while deleting the invitation.',
    invitationNotFound: 'No member was found for the invitation.',
    memeberAlreadyExist: 'The member already exists.',
    memberAlreadyExistInDifferentWorkspace: "This user has been associated with another workspace so can't be invited. Please try again with a different email address",
    notAllowedToInvite: 'You are not allowed to add members based on certain criteria.',
    invitationSendToAll: 'The invitation has been sent to all members successfully.',
    forgetPasswordEmailSent: 'The forgot password email has been sent successfully.',
    invitationRejected: 'The invitation has been rejected successfully.',
}


const jobsMessages = {
    jobUrlRequired: 'Job URL is required.',
    jobIdRequired: 'Job ID is required.',
    jobFound: 'The job has been found successfully.',
    jobsFound: 'The jobs have been found successfully.',
    jobsFoundError: 'An error occurred while fetching jobs.',
    jobCreated: 'The job has been created successfully.',
    jobUpdated: 'The job has been updated successfully.',
    jobUpadteError: 'An error occurred while updating the job.',
    jobDeleted: 'The job has been deleted successfully.',
    jobCreatedError: (error: string) => {
        return error ? `An error occurred while creating the job: ${error}` : 'An error occurred while creating the job.'
    },
    jobFoundAndSynced: 'The job has been found and synced with the proposal.',
    jobMustSync: 'The job was not found. Please sync the proposal before proceeding.',
    jobNotFound: 'The job was not found.',
    jobCategoriesFetchedError: 'An error occurred while fetching job categories.',
    bidderAccountIdsFetched: 'The bidder account IDs have been fetched successfully.',
    bidderAccountIdsError: 'An error occurred while fetching bidder account IDs.',
    companyAccountIdsFetched: 'The company account IDs have been fetched successfully.',
    companyAccountIdsError: 'An error occurred while fetching company account IDs.',
}


const linkedinCompanyMessages = {
    linkedinCompanuAlreadyExist: 'The LinkedIn company already exists.',
    linkedinCompanyCreated: 'The LinkedIn company has been created successfully.',
    linkedinCompanyCreateError: 'An error occurred while creating the LinkedIn company.',
}


const linkedinContactMessages = {
    linkedinContactAlreadyExist: 'The LinkedIn contact already exists.',
    linkedinContactCreated: 'The LinkedIn contact has been created successfully.',
    linkedinContactCreateUnderIndustry: (industry: string) => {
        return industry ? `The contact has been created successfully under the industry '${industry}'` : 'The contact has been created successfully.'
    },
    linkedinContactUpdateUnderIndustry: (industry: string) => {
        return industry ? `The contact has been updated successfully under the industry '${industry}'` : 'The contact has been updated successfully.'
    },
    linkedinContactCreateError: 'An error occurred while creating the LinkedIn contact.',
    synceLinkedinProspect: 'The LinkedIn prospect has been synced successfully.',
    synceLinkedinProspectError: 'An error occurred while syncing the LinkedIn prospect.',
    contactSkillCreated: 'The contact skill has been created successfully.',
    contactSkillCreateError: 'An error occurred while creating the contact skill.',
    linkedinStatsFetched: 'The LinkedIn stats have been fetched successfully.',
    linkedinStatsError: 'An error occurred while fetching the LinkedIn stats.',
    linkedinListFetched: (type: string) => {
        return type ? `The LinkedIn account ${type} has been fetched successfully.` : 'The LinkedIn account list has been fetched successfully.'
    },
    linkedinAccountsNotFound: 'No LinkedIn accounts were found.',
}


const linkMessages = {
    linkCreated: 'The link has been created successfully.',
    linkCreateError: 'An error occurred while creating the link.',
    linkDeleted: 'The link has been deleted successfully.',
    linkDeleteError: 'An error occurred while deleting the link.',
    linkNotFound: 'The link was not found.',
    linkAlreadyExists: 'The link already exists.',
    linkPortfolioFetched: 'The portfolio links have been fetched successfully.',
    linkPortfolioFetchedError: 'An error occurred while fetching the portfolio links.',
    linkPortfolioDeleteError: 'An error occurred while deleting the portfolio links.',
};


const emailMessages = {
    emailSent: 'The email has been sent successfully.',
    emailSendError: 'An error occurred while sending the email.',
    emailNotFound: 'The email was not found.',
    emailAlreadyExists: 'The email already exists.',
    credentialSentError: 'An error occurred while sending the credentials.',
    forgetEmailError: 'An error occurred while sending the forget-password email.',
    optVarificationError: 'An error occurred while sending the OTP verification email.',
};


const notificationsMessages = {
    findNotficiationByIdNotFound: (id: string) => {
        return id ? `The notification was not found with ID ${id}.` : 'The notification was not found.';
    },
    maintenanceModeDisabled: 'Maintenance mode disabled successfully',
};


const portfoliosMessages = {
    allPortfoliosFetched: 'All portfolios have been fetched successfully.',
    allPortfoliosFetchedError: 'An error occurred while fetching all portfolios.',
    portfolioByIdFetched: 'The portfolio has been fetched successfully.',
    portfolioByIdFetchedError: 'An error occurred while fetching the portfolio.',
    portfolioAlreadyExists: 'The portfolio already exists.',
    duplicateUrl: 'The portfolio URL already exists.',
    portfolioCreated: 'The portfolio has been created successfully.',
    portfolioCreateError: 'An error occurred while creating the portfolio.',
    portfolioTypeInvalid: 'The portfolio type is invalid.',
    bulkPortflioCreated: 'Bulk portfolios have been created successfully.',
    portfolioNotFound: 'The portfolio was not found.',
    portfolioUpdated: 'The portfolio has been updated successfully.',
    portfolioUpdateError: 'An error occurred while updating the portfolio.',
    portfolioByTagsFetched: 'Portfolios by tags have been fetched successfully.',
    portfolioByTagsError: 'An error occurred while fetching portfolios by tags.',
    portfolioDeleted: 'The portfolio has been deleted successfully.',
    portfolioDeleteError: 'An error occurred while deleting the portfolio.',
};


const tagMessages = {
    allTagsFetched: 'All tags have been fetched successfully.',
    allTagsFetchedError: 'An error occurred while fetching all tags.',
    tagAlreadyExists: 'The tag already exists.',
    tagCreated: 'The tag has been created successfully.',
    tagCreateError: 'An error occurred while creating the tag.',
    tagDeleted: 'The tag has been deleted successfully.',
    tagDeleteError: 'An error occurred while deleting the tag.',
    tagNotFound: 'The tag was not found.',
};


const profileMessages = {
    profilesFetched: 'Profiles have been fetched successfully.',
    profilesFetchedError: 'An error occurred while fetching profiles.',
    companyProfilesFetched: 'Company profiles have been fetched successfully.',
    companyProfilesFetchedError: 'An error occurred while fetching company profiles.',
    profileByIdFetched: 'The profile has been fetched successfully.',
    profileByIdFetchedError: 'An error occurred while fetching the profile.',
    profileCreated: 'The profile has been created successfully.',
    profileCreateError: 'An error occurred while creating the profile.',
    profileUpdated: 'The profile has been updated successfully.',
    profileUpdateError: 'An error occurred while updating the profile.',
    profileNotFound: 'The profile was not found.',
    profileDeleted: 'The profile has been deleted successfully.',
    profileDeleteError: 'An error occurred while deleting the profile.',
    profileAlreadyExists: 'The profile already exists.',
};


const settingsMessages = {
    settingsUpdated: 'Settings have been updated successfully.',
    settingsUpdateError: 'An error occurred while updating the settings.',
    settingsNotFound: 'The settings were not found.',
    userSettingsUpdated: 'User settings have been updated successfully.',
    userSettingsUpdateError: 'An error occurred while updating user settings.',
    userSettingsCreated: 'User settings have been created successfully.',
    userSettingsCreateError: 'An error occurred while creating user settings.',
};


const skillsMessages = {
    skillCreated: 'The skill has been created successfully.',
    skillCreateError: 'An error occurred while creating the skill.',
};


const usersMessages = {
    getCompanyUsers: 'Company users have been fetched successfully.',
    getCompanyUsersError: 'An error occurred while fetching company users.',
    getCompanyUsersById: 'The company user has been fetched successfully.',
    getCompanyUsersByIdError: 'An error occurred while fetching the company user.',
    countAllcompanyUsers: 'The count of all company users has been fetched successfully.',
    countAllcompanyUsersError: 'An error occurred while fetching the count of all company users.',
    pendingInvitesFetched: 'Pending invites have been fetched successfully.',
    pendingInvitesFetchedError: 'An error occurred while fetching pending invites.',
    userCreated: 'The user has been created successfully.',
    userCreateError: 'An error occurred while creating the user.',
    userDeleted: 'The user has been deleted successfully.',
    userDeleteError: 'An error occurred while deleting the user.',
    userUpdated: 'The user has been updated successfully.',
    userUpdateError: 'An error occurred while updating the user.',
    userAlreadyExists: 'The user already exists.',
    userAdded: 'The user has been added successfully.',
    userAddError: 'An error occurred while adding the user.',
    userNameUpdated: 'The user name has been updated successfully.',
    userProfileUpdated: 'The user profile has been updated successfully.',
    userRoleUpdated: 'The user role has been updated successfully.',
    userStatusUpdated: 'The user status has been updated successfully.',
    userGoalCount: 'The user goal count has been fetched successfully.',
    userGoalCountError: 'An error occurred while fetching the user goal count.',
};


const superAdminMessages = {
    otpSent: 'OTP has been sent successfully to your email.',
    otpVerified: 'OTP has been verified successfully.',
    otpVerificationError: 'An error occurred while verifying the OTP.',
    otpNotValid: 'The provided OTP is not valid.',
};


const configurationsMessages = {
    configurationUpdated: 'Configuration has been updated successfully.',
    configurationUpdateError: 'An error occurred while updating the configuration.',
    configurationNotFound: 'The configuration was not found.',
};


export {
    accountsMessages,
    authMessages,
    bidsMessages,
    logsMessages,
    clickUpMessages,
    hubspotMessages,
    contactsMessages,
    commentsMessages,
    companiesMessages,
    educationMessages,
    errorsMessages,
    experiencesMessages,
    industriesMessages,
    institutionsMessages,
    integrationsMessages,
    invitationsMessages,
    jobsMessages,
    linkedinCompanyMessages,
    linkedinContactMessages,
    linkMessages,
    emailMessages,
    notificationsMessages,
    portfoliosMessages,
    tagMessages,
    profileMessages,
    settingsMessages,
    skillsMessages,
    usersMessages,
    superAdminMessages,
    configurationsMessages,
};
