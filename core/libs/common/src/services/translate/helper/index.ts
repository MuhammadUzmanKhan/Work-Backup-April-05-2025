import { I18nService } from 'nestjs-i18n';
import {
  convertStringToSnakeCase,
  formatDateTimeWithTimezone,
  humanizeTitleCase,
} from '../../../helpers';
import { ChangeLog } from '../../../models';

export const parseDispatchedChangeLog = (changelogText: string) => {
  const namePattern =
    /^(.*?)(?=\s+(?:Added\s+—\s+Dispatched|—\s+Removed from incident))/;
  const typePattern = /(Added|Removed|Status Change)/;
  const statusPattern = /—\s(.*?)$/;
  const statusChangePattern = /from\s(.+?)\sto\s(.+?)$/;

  const nameMatch = changelogText.match(namePattern);
  const typeMatch = changelogText.match(typePattern);
  const statusMatch = changelogText.match(statusPattern);
  const statusChangeMatch = changelogText.match(statusChangePattern);

  const name = nameMatch ? nameMatch[1].trim() : null;
  const type = typeMatch ? typeMatch[1] : null;

  let status = null;
  if (type === 'Status Change' && statusChangeMatch) {
    status = {
      from: statusChangeMatch[1].trim(),
      to: statusChangeMatch[2].trim(),
    };
  } else {
    status = statusMatch ? statusMatch[1].trim() : null;
  }
  return {
    name: name,
    status: status,
    type: type,
  };
};

export const getDispatchedActionType = (type: string): string => {
  switch (type) {
    case 'Removed':
      return `removed_dispatched`;
    case 'Added':
      return `added_dispatched`;
    default:
      return `change_dispatched`;
  }
};

export const formatIncidentChangeLog = (
  changelog: ChangeLog,
  timezone: string,
  userLanguage: string,
  i18n: I18nService,
) => {
  const {
    column,
    old_value: oldValue,
    new_value: newValue,
    additional_values,
  } = changelog;

  const formattedValues = {
    oldValue,
    newValue,
    action: null,
    column,
    name: null,
  };

  switch (column) {
    case 'created_by':
    case 'updated_by':
      const _name = extractNameForCreatedBy(changelog['text']);
      formattedValues.newValue = _name ? _name : newValue;

      formattedValues['action'] = 'column_value';

      break;

    case 'incident_divisions':
      formattedValues['action'] = 'change_to';

      break;

    case 'is_legal':
      formattedValues['action'] = 'enable_disable';

      break;

    case 'company_name':
    case 'event_name':
    case 'id':
      formattedValues['action'] = 'of_incident_is';

      break;

    case 'logged_date_time':
      formattedValues.oldValue = oldValue
        ? formatDateTimeWithTimezone(oldValue, timezone)
        : oldValue;
      formattedValues.newValue = newValue
        ? formatDateTimeWithTimezone(newValue, timezone)
        : newValue;

      break;

    case 'status':
    case 'priority':
      formattedValues.oldValue = oldValue
        ? getStatusPriorityTranslation(oldValue, column, userLanguage, i18n)
        : oldValue;

      formattedValues.newValue = newValue
        ? getStatusPriorityTranslation(newValue, column, userLanguage, i18n)
        : newValue;
      break;

    case 'dispatched':
      const { name, status, type } = parseDispatchedChangeLog(
        changelog['text'],
      );

      formattedValues.name = name;
      formattedValues.action = getDispatchedActionType(type);

      if (type === 'Added') {
        formattedValues.newValue = getStatusPriorityTranslation(
          status,
          'status',
          userLanguage,
          i18n,
        );

        formattedValues.oldValue = null;
      } else if (type === 'Status Change' && status) {
        formattedValues.oldValue = getStatusPriorityTranslation(
          status.from,
          'status',
          userLanguage,
          i18n,
        );

        formattedValues.newValue = getStatusPriorityTranslation(
          status.to,
          'status',
          userLanguage,
          i18n,
        );
      }

      break;

    default:
      break;
  }

  if (!formattedValues['action']) {
    formattedValues.action = oldValue ? 'change_from' : 'set_to';
  }

  if (additional_values) {
    if (additional_values['user_name']) {
      formattedValues['name'] = additional_values['user_name'];
    }
  }

  return formattedValues;
};

export const statusMapping = {
  'On Scene': 'at_scene',
  Transport: 'in_route',
};

export const convertStatusToKey = (status: string): string => {
  return statusMapping[status] || convertStringToSnakeCase(status);
};

export const getStatusPriorityTranslation = (
  value: string,
  column: 'status' | 'priority',
  userLanguage: string,
  i18n: I18nService,
) => {
  const valueKey = convertStatusToKey(value);
  return i18n.t(`${userLanguage}.${column}.${valueKey}`, {
    lang: userLanguage,
    defaultValue: value,
  });
};

export const extractNameForCreatedBy = (text: string) => {
  // Check if the text contains "updated to"
  if (text.includes('updated to')) {
    // Use regex to extract the name with or without quotes following "updated to"
    const match = text.match(/updated to\s+"?([^"]+)"?/);
    if (match) {
      return match[1];
    }
  }
  // If text contains "created by", return false
  else if (text.includes('created by')) {
    return false;
  }
  // If none of the conditions are met, return null
  return null;
};

export const getKeyColumnLabel = (
  i18n: I18nService,
  column: string,
  action: string,
  language: string,
  oldValue: string,
  newValue: string,
  name: string,
  type: string,
  subTaskName: string,
  imageName,
  cadVersion?,
  cadName?,
  incidentName?: string,
) => {
  // Determine the file to use for column label translation
  // If the file type is Legal group then because it is inside the legal group,therefor we change the type to incident
  const file =
    type === 'LegalGroup'
      ? `${language}-incident`
      : `${language}-${type.toLowerCase()}`;

  const columnLabel = i18n.t(`${file}.labels.${column}`, {
    lang: file,
    defaultValue: column,
  });
  const key = `${file}.actions.${action}`;

  const params = {
    column_name: columnLabel,
    first_val: oldValue || 'N/A',
    second_val: newValue || 'N/A',
    value: newValue || 'N/A',
    name,
    subTaskName,
    imageName: imageName || '',
    cadVersion: cadVersion || 'N/A',
    cadName: cadName || 'N/A',
    incident_type_name: incidentName || '',
  };

  return { key, params };
};

const extractValuesFromText = (
  text: string,
): { extractedNewValue: string | null; extractedOldValue: string | null } => {
  const match = text.match(/'([^']*)'\s+to\s+'([^']*)'/);

  return {
    extractedOldValue: match?.[1] !== 'N/A' ? match?.[1] : null,
    extractedNewValue: match?.[2] !== 'N/A' ? match?.[2] : null,
  };
};

export const formatTaskChangeLog = (
  changelog: ChangeLog | any,
  timezone: string,
  type?: string,
) => {
  const { column, old_value: oldValue, new_value: newValue } = changelog;

  const logText = changelog.formatted_log_text ?? changelog.text;

  // Extract new and old values from text
  const { extractedNewValue, extractedOldValue } =
    extractValuesFromText(logText);

  const formattedValues = {
    oldValue,
    newValue,
    action: null,
    column,
    name: null,
  };

  switch (column) {
    case 'task':
      formattedValues['action'] = 'created';

      break;

    case 'subtask':
      formattedValues['action'] = 'created_subtask';

      break;

    case 'priority':
      if (type === 'Subtask') {
        newValue
          ? (formattedValues['action'] = 'subtask_set')
          : (formattedValues['action'] = 'unsetsubtask_unset');
      } else {
        newValue
          ? (formattedValues['action'] = 'set')
          : (formattedValues['action'] = 'unset');
      }

      break;

    case 'incident_division_id':
      formattedValues['action'] = 'updated_from';
      formattedValues.oldValue = extractedOldValue;
      formattedValues.newValue = extractedNewValue;

      break;

    case 'task_list_id':
      if (type === 'Subtask') {
        formattedValues['action'] = 'updated_from_subtask';
      } else {
        formattedValues['action'] = 'updated_from';
      }

      break;

    case 'department_id':
      if (type === 'Subtask') {
        newValue === null
          ? (formattedValues['action'] = 'unassigned_subtask')
          : oldValue === null || newValue
            ? (formattedValues['action'] = 'assigned_subtask')
            : (formattedValues['action'] = 'updated_from_subtask');
      } else {
        newValue === null
          ? (formattedValues['action'] = 'unassigned')
          : oldValue === null || newValue
            ? (formattedValues['action'] = 'assigned')
            : (formattedValues['action'] = 'updated_from');
      }
      break;

    case 'user':
      if (type === 'Subtask') {
        newValue === null
          ? (formattedValues['action'] = 'unassigned_subtask')
          : (formattedValues['action'] = 'assigned_subtask');
      } else {
        newValue === null
          ? (formattedValues['action'] = 'unassigned')
          : (formattedValues['action'] = 'assigned');
      }
      break;

    case 'image':
      if (type === 'Subtask') {
        newValue === null
          ? (formattedValues['action'] = 'delete_subtask_image')
          : (formattedValues['action'] = 'subtask_image');
      } else {
        newValue === null
          ? (formattedValues['action'] = 'delete_image')
          : (formattedValues['action'] = 'task_image');
      }
      break;

    case 'category':
      if (type === 'Subtask') {
        newValue === null
          ? (formattedValues['action'] = 'unassigned_subtask')
          : (formattedValues['action'] = 'assigned_subtask');
      } else {
        newValue === null
          ? (formattedValues['action'] = 'unassigned')
          : (formattedValues['action'] = 'assigned');
      }
      break;

    case 'start_date':
    case 'deadline':
      formattedValues.oldValue = oldValue
        ? formatDateTimeWithTimezone(oldValue, timezone)
        : oldValue;
      formattedValues.newValue = newValue
        ? formatDateTimeWithTimezone(newValue, timezone)
        : newValue;

      break;

    default:
      if (type === 'Subtask') {
        formattedValues['action'] = 'updated_from_subtask';
      } else {
        formattedValues['action'] = 'updated_from';
      }
      break;
  }

  if (!formattedValues['action']) {
    formattedValues.action = oldValue ? 'updated_from' : 'set_to';
  }

  return formattedValues;
};

export const formatLegalGroupChangeLog = (
  changelog: ChangeLog,
  formattedDate?: string,
) => {
  const { column, old_value: oldValue, new_value: newValue } = changelog;

  const formattedValues = {
    oldValue,
    newValue,
    action: null,
    column,
    name: null,
    value: null,
    formattedDate,
  };

  if (column === 'status') {
    formattedValues.action = 'updated_from';
    formattedValues.oldValue = oldValue;
    formattedValues.newValue = newValue;
    formattedValues.formattedDate = formattedDate;
  } else {
    formattedValues.action = oldValue ? 'updated_from' : 'set_to';
  }

  return formattedValues;
};

export const formatEventChangeLog = (
  changelog: ChangeLog,
  subTaskName: string,
) => {
  const { column, old_value: oldValue, new_value: newValue } = changelog;

  const formattedValues = {
    oldValue,
    newValue,
    action: null,
    column,
    name: null,
  };

  switch (column) {
    case 'creation':
      formattedValues['action'] = 'created';

      break;

    case 'subtask':
      formattedValues['action'] = 'created_subtask';

      break;

    case 'name':
      !subTaskName
        ? (formattedValues['action'] = 'updated_from')
        : (formattedValues['action'] = 'updated_from_subtask');

      break;

    case 'event_access_lock':
      newValue
        ? (formattedValues['action'] = 'enabled')
        : (formattedValues['action'] = 'disabled');

      break;

    case 'demo_event':
      newValue
        ? (formattedValues['action'] = 'demo')
        : (formattedValues['action'] = 'demo_remove');

      break;

    case 'division_lock_service':
      newValue
        ? (formattedValues['action'] = 'enabled')
        : (formattedValues['action'] = 'disabled');

      break;

    case 'attachment':
    case 'image':
      if (!subTaskName) {
        newValue === null
          ? (formattedValues['action'] = 'delete_image')
          : (formattedValues['action'] = 'image');
      } else {
        newValue === null
          ? (formattedValues['action'] = 'delete_subtask_image')
          : (formattedValues['action'] = 'subtask_image');
      }
      break;

    case 'update event cad current version':
      formattedValues['action'] = 'set_to';
      break;

    case 'event cad creation':
      formattedValues['action'] = 'set_to';
      break;

    case 'completed':
      newValue
        ? (formattedValues['action'] = 'complete_task')
        : (formattedValues['action'] = 'incomplete_task');
      break;

    case 'deadline':
      formattedValues['action'] = 'updated_from_subtask';
      break;

    case 'event_cad':
      formattedValues['action'] = 'event_cad';
      break;

    case 'status':
      formattedValues.oldValue = oldValue
        ? humanizeTitleCase(oldValue)
        : oldValue;
      formattedValues.newValue = newValue
        ? humanizeTitleCase(newValue)
        : newValue;
      break;

    case 'current_version':
      formattedValues['action'] = 'current_version';
      break;

    default:
      formattedValues['action'] = 'updated_from';
      break;
  }

  if (!formattedValues['action']) {
    formattedValues.action = oldValue ? 'updated_from' : 'set_to';
  }

  return formattedValues;
};

export const formatCompanyChangeLog = (changelog: ChangeLog) => {
  const { column, old_value: oldValue, new_value: newValue } = changelog;

  const formattedValues = {
    oldValue,
    newValue,
    action: null,
    column,
    name: null,
  };

  switch (column) {
    case 'company':
      formattedValues['action'] = 'created';

      break;

    default:
      formattedValues['action'] = 'updated_from';
      break;
  }

  if (!formattedValues['action']) {
    formattedValues.action = oldValue ? 'updated_from' : 'set_to';
  }

  return formattedValues;
};

export const formatIncidentTypeChangeLog = (changelog: ChangeLog) => {
  const {
    column,
    old_value: oldValue,
    new_value: newValue,
    additional_values,
  } = changelog;

  const formattedValues = {
    oldValue,
    newValue,
    action: null,
    column,
    name: null,
    incidentName: null,
  };

  switch (column) {
    case 'name':
      if (oldValue) formattedValues['action'] = 'updated_to';
      else formattedValues['action'] = 'added';

      break;

    case 'translation':
      if (oldValue) formattedValues['action'] = 'changed_to';
      else formattedValues['action'] = 'added_variant';

      break;

    default:
      formattedValues['action'] = 'changed_to';
      break;
  }

  if (!formattedValues['action']) {
    formattedValues.action = 'changed_to';
  }

  // we have a new column of additional_values in changelogs which can store any extra information about changelogs
  if (additional_values) {
    if (additional_values['company_name'])
      formattedValues.name = additional_values['company_name'];

    if (additional_values['core_incident_type_name'])
      formattedValues.incidentName =
        additional_values['core_incident_type_name'];
  }

  return formattedValues;
};

export const getSubTaskTypeAndName = (log: ChangeLog) => {
  const regex = /Subtask\s*\((.*?)\)/;
  let subTask: string;
  let subTaskName: string;

  const match = log['text']?.match(regex);

  if (match) {
    subTask = 'Subtask'; // This is static since we are looking for the word "Subtask"
    subTaskName = match[1];
  }

  return { subTask, subTaskName };
};

export const getEventRegexAttributes = (log: ChangeLog) => {
  let subTaskName: string;
  let cadVersion: string;
  let cadName: string;

  const regex = /Event Task '([^']+)'/;
  const match = log['text']?.match(regex);
  if (match) {
    subTaskName = match ? match[1] : null;
  }

  if (log.column === 'event_cad') {
    const regex = /Version '([^']+)' against '([^']+)'/;
    const match = log['text']?.match(regex);
    cadVersion = match ? match[1] : null;
    cadName = match ? match[2] : null;
  }

  if (log.column === 'current_version') {
    const matches = log['text']?.match(/'(.*?)'/g);
    if (matches) {
      cadName = matches[0].replace(/'/g, ''); //get file name
      cadVersion = matches[1].replace(/'/g, ''); //get file version
    }
  }

  return { subTaskName, cadVersion, cadName };
};
