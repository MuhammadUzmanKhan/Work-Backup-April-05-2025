// error messages
export const ERRORS = {
  EVENT_NOT_FOUND: 'Event Not Found',
  EVENT_ALREADY_EXISTS: 'Event Already Exists',
  COMPANY_NOT_FOUND: 'Company Not Found',
  PARENT_COMPANY_NOT_FOUND: 'Parent Company Not Found',
  SUBTASK_NOT_FOUND: 'SubTask Not Found',
  INFORMATION_REQUEST_NOT_FOUND: 'Information Request Not Found',
  ATTACHMENT_NOT_FOUND: 'Attachment Not Found',
  COMMENT_CANNOT_BE_EMPTY: 'Comment cannot be Empty',
  DONT_HAVE_ACCESS: 'You do not have access',
  SOMETHING_WENT_WRONG: 'Something Went Wrong',
  FILE_MISSING: 'File is Required',
  COMPANY_ALREADY_EXISTS: 'Company Already Exists',
  DEPARTMENT_NOT_FOUND: 'Department Not Found',
  EVENT_DATA_IS_MISSING: 'Event data is Missing',
  COMPANY_ID_IS_REQUIRED: 'Company ID is Required',
  EVENT_ID_MUST_BE_A_NUMBER: 'Event ID must be a Number',
  COMPANY_ID_MUST_BE_A_NUMBER: 'Company ID must be a Number',
  PRIORITY_GUIDE_NOT_FOUND: 'Priority Guide Not Found',
  SOURCE_NOT_FOUND: 'Source Not Found',
  SOURCES_NOT_FOUND: 'Sources Not Found',
  EVENT_CAD_NOT_FOUND: 'Event Cad Not Found',
  SOURCE_HAS_BEEN_ALREADY_ASSOCIATED_TO_EVENTS_IT_CANT_BE_DESTROYED:
    'The Source has Already been Associated with Events, it cannot be Destroyed',
  INCIDENT_NOT_FOUND: 'Incident Not Found',
  INCIDENT_DIVISION_NOT_FOUND: 'Incident Division Not Found',
  INCIDENT_DIVISION_HAS_BEEN_ALREADY_ASSOCIATED_TO_EVENTS_IT_CANT_BE_DESTROYED:
    'Incident Division has been Already Associated with other Events, it cannot be Destroyed',
  INCIDENT_DIVISION_IS_NOT_ASSOCIATED_WITH_PASSED_EVENT:
    'Incident Division is not Associated with Passed Event',
  INCIDENT_TYPE_NOT_FOUND: 'Incident Type Not Found',
  INCIDENT_TYPE_VARIANT_NOT_FOUND: 'Incident Type Variant Not Found',
  INCIDENT_TYPE_HAS_BEEN_ALREADY_ASSOCIATED_WITH_OTHER_EVENTS_IT_CANT_BE_DESTROYED:
    'Incident Type has been Already Associated with other Events, it cannot be Destroyed',
  INCIDENT_ARE_LINKED_WITH_THIS_INCIDENT_TYPE_IT_CANT_BE_DESTROYED:
    'Incident are Linked with this Incident Type, it cannot be Destroyed',
  INCIDENT_TYPE_IS_NOT_ASSOCIATED_WITH_PASSED_EVENT:
    'Incident Type is not Associated with Passed Event',
  WE_COULD_NOT_FIND_INVENTORY_FOR_PASSED_INVENTORY_ID:
    'We couldnt find inventory for passed inventory_id. Please make sure inventory_id is correct',
  PRESET_MESSAGE_NOT_FOUND: 'Preset Message Not Found',
  DIVISION_ID_REUQUIRED: 'Division Id Is Requried',
  EVENT_ID_IS_REQUIRED_IF_USER_ASSOCIATED_WITH_PASSED_DIVISIONS_IDS:
    'Event Id Is Required If User Associated With Passed Divisions ids',
  ROLE_INCORRECT_ONLY_VENDOR_ALLWOED_TO_CREATE_DRIVER:
    'Role Incorrect Only Vendor Allwoed To Create Driver',
  EVENT_ID_REQUIRED: 'Event Id Is Required',
  YOU_NOT_BELONG_TO_THIS_EVENT_MAKE_SURE_YOU_BELONGS_TO_THE_EVENT_YOU_ARE_ASSIGNING:
    'You Not Belong To This Event Make Sure You Belongs To The Event You Are assigning',
  YOUR_SYSTEM_ROLE_NOT_ALLOW_YOU_TO_CHANGE_CONTACT_INFORMATION_CONTACT_ADMIN_OR_INCIDENT_MANAGER:
    'Your System Role Not Allow You To Change Contact Information Contact Admin Or Incident manager',
  ONLY_SUPER_ADMIN_IS_AUTHORIZED_TO_PERFORM_THIS_ACTION:
    'Only Super Admin Is Authorized To Perform This action',
  USER_ALREADY_EXIST: 'User Already Exist',
  INCIDENT_TYPE_ALREADY_EXIST: 'Incident Type Already Exists',
  USER_CELL_EXIST: 'User Already Exist with Provided Cell',
  USER_NOT_FOUND: 'User Not Found',
  CAMPER_NOT_FOUND: 'Camper Not Found',
  ALERT_NOT_FOUND: 'Alert Not Found',
  VENDOR_IS_NOT_ASSOCIATED_WITH_PASSED_EVENT_ID:
    'The Vendor Is Not Associated With Passed Event_id',
  DAY_ID_IS_REQUIRED_IF_A_DRIVER_IS_ASSOCIATED_WITH_THE_PASSED_ROUTE_SHIFT:
    'Day Id Is Required If A Driver Is Associated With The Passed Route/Shift',
  DAY_NOT_FOUND: 'Day not found',
  NO_SHIFT_FOUND_FOR_THIS_ROUTE: 'No Shift Found For This Route',
  NO_ROUTE_FOUND_FOR_THE_PASSED_DAY_ID: 'No Route Found For The Passed Day ID',
  DEPARTMENT_NOT_ASSOCIATED_WITH_PASS_EVENT_ID:
    'Department not Associated with Pass Event Id',
  DEPARTMENT_HAS_ALREADY_BEEN_ASSOCIATED_WITH_OTHER_INCIDENTS:
    'Department has Already been Associated with Other Incidents',
  DATA_NOT_FOUND_AGAINST_GIVEN_ID:
    'No Data Found With The Given Commentable Id',
  INCIDENT_MESSAGE_CENTER_NOT_FOUND: 'Incident Message Center Not Found',
  SCAN_COULD_NOT_BE_CREATED: 'Scan could not be Created',
  MOBILE_INCIDENT_INBOX_NOT_FOUND: 'Mobile Incident Inbox Not Found',
  SCAN_NOT_FOUND: 'Scan Not Found',
  MOBILE_INCIDENT_INBOX_COULD_NOT_BE_CREATED:
    'Mobile Incident Inbox could not be Created',
  MOBILE_INCIDENT_INBOX_COULD_NOT_BE_UPDATED:
    'Mobile Incident Inbox could not be Updated',
  REQUIRED_RESOURCE_IS_UNDER_DEVELOPMENT:
    'Required Resource is Under Development',
  GLOBAL_INCIDENT_DATA_PRESENT_FOR_THIS_MOBILE_INBOX_IT_CANNOT_BE_DESTROYED:
    'Global Incident Data present for this Mobile Inbox, it cannot be Destroyed',
  MESSAGE_GROUP_NOT_FOUND: 'Message Group Not Found',
  NO_USER_FOUND: 'No User Found',
  MESSAGES_ARE_DISABLED_ON_THIS_EVENT: 'Messages are disabled on this Event',
  REFERENCE_MAP_NOT_FOUND: 'Reference Map Not Found',
  FILE_IS_NOT_PARSED_CORRECTLY: 'File Is Not Parsed Correctly',
  NAME_IS_REQUIRED: 'Name is required',
  AT_LEAST_ONE_USER_COMPANY_REQUIRED:
    'A user must be associated with at least one company at all times',
  PRIORITY_INVALID: 'Invalid priority value',
};

// Success Response Messages
export const MESSAGES = {
  SOURCE_SUCCESSFULLY_REMOVED: 'Source Successfully Removed',
  SOURCE_ASSOCIATED_SUCCESSFULLY: 'Source Auccessfully Associated',
  SOURCE_DESTROYED_SUCCESSFULLY: 'Source Successfully Destroyed',
  INCIDENT_DIVISION_DESTROYED_SUCCESSFULLY:
    'Incident Division Successfully Destroyed',
  INCIDENT_DIVISION_DISASSOCIATED_SUCCESSFULLY:
    'Incident Division Successfully Disassociated',
  INCIDENT_DIVISION_ASSOCIATED_SUCCESSFULLY:
    'Incident Division Successfully Associated',
  INCIDENT_TYPE_DESTROYED_SUCCESSFULLY: 'Incident Type Successfully Destroyed',
  INCIDENT_TYPE_ASSOCIATED_SUCCESSFULLY:
    'Incident Type Successfully Associated',
  INCIDENT_TYPE_DISASSOCIATED_SUCCESSFULLY:
    'Incident Type Successfully Disassociated',
  PRESET_MESSAGE_DESTROYED_SUCCESSFULLY:
    'Preset Message Destroyed Successfully',
  DEPARTMENT_ASSIGNED_SUCCESSFULLY: 'Department Assigned Successfully',
  DIVISION_ASSIGNED_SUCCESSFULLY: 'Division Assigned Successfully',
  ALERT_SUCCESSFULLY_ADDED: 'Alert Successfully Added',
  ALERT_SUCCESSFULLY_DESTROYED: 'Alert Successfully Destroyed',
  INVENTORY_DISASSOCIATED_SUCCESSFULLY: 'Inventory Disassociated Successfully',
  INVENTORY_ASSOCIATED_SUCCESSFULLY: 'Inventory Associated Successfully',
  DEPARTMENT_DISASSOCIATED_SUCCESSFULLY:
    'Department Disassociated Successfully',
  DEPARTMENT_ASSOCIATED_SUCCESSFULLY: 'Department Associated Successfully',
  ALERTS_REMOVED_SUCCESSFULLY: 'Alerts Removed Successfully',
  MOBILE_INCIDENT_INBOX_SUCCESSFULLY_DESTROYED:
    'Mobile Incident Inbox Successfully Destroyed',
  INCIDENT_MESSAGE_CENTER_DESTROYED_SUCCESSFULLY:
    'Incident Message Center Destroyed Successfully',
  USERS_SUCCESSFULLY_ADDED_IN_MESSAGE_GROUP:
    'Users Successfully Added In Message Group',
  REFERENCE_MAP_DESTROYED_SUCCESSFULLY: 'Reference Map Destroyed Successfully',
  EMAIL_HAS_BEEN_SENT_SUCCESSFULLY: 'Email Has Been Sent Successfully',
  NOT_PLACED_DOTS: 'Please deploy the Dots first',
};

// succcess messages
export const SUCCESS = 'SUCCESS';

export const RESPONSES = {
  notFound: (modelName: string) => `${modelName} Not Found`,
  destroyedSuccessfully: (modelName: string) =>
    `${modelName} Destroyed Successfully`,
  updatedSuccessfully: (modelName: string) =>
    `${modelName} Updated Successfully`,
  createdSuccessfully: (modelName: string) =>
    `${modelName} Created Successfully`,
  alreadyExist: (modelName: string) => `${modelName} Already Exist`,
  associatedSuccessfully: (modelName: string) =>
    `${modelName} Associated Successfully`,
  disassociatedSuccessfully: (modelName: string) =>
    `${modelName} Disassociated Successfully`,
  assignedSuccessfully: (modelName: string) =>
    `${modelName} Assigned Successfully`,
  unassignedSuccessfully: (modelName: string) =>
    `${modelName} Unassigned Successfully`,
  noAccess: (modelName: string) => `You don't have access ${modelName}`,
  uploadedSuccessfully: (modelName: string) =>
    `${modelName} Uploaded Successfully`,
  swappedSuccessfully: (modelName: string) =>
    `${modelName} Swapped Successfully`,
  copiedSuccessfully: (modelName: string) => `${modelName} Copied Successfully`,
  savedSuccessfully: (modelName: string) => `${modelName} Saved Successfully`,
};
