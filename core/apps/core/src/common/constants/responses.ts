// error messages
export const _ERRORS = {
  EVENT_HAVE_SOME_RELATIONAL_DATA: 'Event Have Some Relational Data',
  EVENT_TEMPLATE_NOT_FOUND: 'Event Template Not Found',
  TEMPLATE_WITH_SAME_SLUG_ALREADY_EXITS:
    'TEMPLATE WITH SAME SLUG ALREADY EXITS',
  SOME_RECORDS_HAVE_ERRORS: 'Some records have errors',
  FILE_UPLOADED_SUCCESSFULLY_BUT_SOME_RECORDS_HAVE_ANOMALIES:
    'File Uploaded Successfully But Some Records Have Anomalies',
  EVENT_TEMPLATE_ALREADY_EXISTS: 'Event Template Already Exist',
  YOU_DONT_HAVE_ACCESS_TO_THIS_COMPANY: "You don't have access to this company",
  USER_IS_NOT_FOUND_AGAINST_THIS_EVENT: 'User Is Not Found Against This Event',
  SOME_USERS_ARE_NOT_FOUND: 'Some users are not found',
  SOME_INCIDENT_DIVISIONS_ARE_NOT_FOUND:
    'Some incident divisions are not found',
  ROLE_IS_MISSING: 'Role is missing',
  CELL_NUMBER_IS_INVALID_WITH_COUNTRY_CODE:
    'Cell number is invalid with country code',
  INVALID_ROLE: 'Invalid Role',
  FIRST_OR_LAST_NAME_IS_MISSING: 'First or Last name is missing',
  YOU_DONT_HAVE_ACCESS_TO_CREATE_SUPER_ADMIN_OR_ONTRACK_MANAGER:
    "You don't have access to create Super Admin or Ontrack Manager",
  THIS_USER_IS_ALREADY_A_SUPER_ADMIN_OR_ONTRACK_MANAGER:
    'This User Is Already A Super Admin Or Ontrack Manager',
  COMPANY_CATEGORY_ERROR: `Parent Company Category should be 'standard'`,
  COMPANY_REGION_NOT_FOUND_ERROR: 'Some of Regions Not Found',
  USER_COMPANY_REGION_ERROR:
    'Only Global Manager, Regional Admin and Regional Manager have Regions',
  GLOBAL_MANAGER_ERROR: 'Global Manager Cannot Create Global Manager',
  DEPARTMENT_CHANGE_WHILE_UPDATING_USER:
    'Please Pass Event or User Company Data to Update Department',
  MISSING_DATA: 'Some of Required data for event is missing',
  USER_ALREADY_ASSOCIATED_WITH_COMPANY:
    'User is already associated to this company.',
  INVALID_EMAIL: 'Invalid Email',
};

// Success Response Messages
export const _MESSAGES = {
  DEPARTMENT_NOT_FOUND_AGAINST_THIS_USER:
    'Department Not Found against this User',
  DEPARTMENT_NOT_FOUND_AGAINST_THIS_COMPANY:
    'Department Not Found against this Company',
  USER_COMPANY_SUCESSFULLY_DESTROYED: 'User Company Sucessfuly Destroyed',
  LOCATION_CREATED_SUCCESSFULLY: 'Location created successfully',
  LOCATION_UPDATED_SUCCESSFULLY: 'Location updated successfully',
  CSV_UPLOADED_SUCCESSFULLY: 'CSV Uploaded Successfully',
  ASSIGN_DEPARTMENT_WITH_EVENT: 'Department with Event Assigned Successfully',
};
