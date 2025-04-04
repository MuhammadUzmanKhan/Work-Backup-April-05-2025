import 'multer';
import { S3 } from 'aws-sdk';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Sequelize, Transaction } from 'sequelize';
import { catchError, firstValueFrom, interval, retry, take } from 'rxjs';
import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  ActiveModulesPermissions,
  ERRORS,
  ScanType,
  RESPONSES,
  IncidentDivisionWithIdName,
  TemplateType,
  REQUEST_EVENT_TYPE,
  IncidentPriorityApi,
} from '../constants';
import {
  Company,
  Event,
  EventSubtasks,
  IncidentMessageCenter,
  Region,
  Template,
  User,
  UserCompanyRole,
} from '../models';

export * from './date-time';
export * from './change-logs';
export * from './pusher';
export * from './response';
export * from './csv-pdf';
export * from './format-case';
export * from './company-role-permission';
export * from './exist-records';
export * from './region';
export * from './model-find';
export * from './translate-with-retry';

/**
 * To Genetrate Pin
 * @returns "XXXX" Pin {String}
 */
export const generatePin = () => {
  return (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
};

/**
 * The purpose of this function to format user data for a response. It takes in the user's name and type, and returns an object with those values under specific keys.
 * @param name who is commenting on event | who is creating change log
 * @param type Logs | Comments
 * @returns The function returns an object with two properties: commented_by and type, which correspond to the values of the name and type parameters, respectively.
 */
export const formatUserInResponse = (name: string, type: string) => {
  return {
    commented_by: name,
    type,
  };
};

/**
 * This function gets an event and finds those modules which are active and return them by combining them into a string.
 * @param event
 * @returns String of Active Modules for an Event.
 */
export const getActiveModulesArray = (event: Event) => {
  const activeModulePermissionsKeys = Object.keys(ActiveModulesPermissions)
    .filter((key) => event[key.toLowerCase()])
    .map((key) => ActiveModulesPermissions[key])
    .join(', ');
  return activeModulePermissionsKeys || 'N/A';
};

/**
 * This function checks if name of multiple files are same. If duplicate file names then it just add count with brackets to the name.
 * i.e file (1).txt
 * @param fileNames
 * @returns An array of new file names.
 */
export const modifyFileNames = (fileNames: string[]) => {
  const newFileNames = [];

  // Iterate through each file name
  for (let i = 0; i < fileNames.length; i++) {
    const fileName = fileNames[i];

    // Find the last dot in the file name to get the extension
    const extensionIndex = fileName.lastIndexOf('.');
    const extension = fileName.substring(extensionIndex);

    // Remove the extension from the file name
    const baseName = fileName.substring(0, extensionIndex);

    let newFileName = fileName;

    // Check if the file name already exists in the new array
    let count = 1;
    while (newFileNames.includes(newFileName)) {
      // If it does, modify the file name by adding a number at the end
      newFileName = `${baseName} (${count})${extension}`;
      count++;
    }

    // Add the modified file name to the new array
    newFileNames.push(newFileName);
  }

  return newFileNames;
};

/**
 *
 * While getting data from other microservice, check if response is an error or proper data.
 * @param data of any type
 * @returns returns data or throws exceptions based on errors.
 */
export const checkCommunicatedData = (data: any) => {
  if (data?.statusCode) {
    switch (data.statusCode) {
      case 404:
        throw new NotFoundException(data.message);
      case 403:
        throw new ForbiddenException(data.message);

      default:
        throw new InternalServerErrorException();
    }
  }
  return data;
};

export const getScanTypeByIndex = (index: number) => {
  const scanTypes = Object.values(ScanType);
  return scanTypes[index] || null;
};

export const getIndexOfScanType = (scanType: ScanType) => {
  return Object.keys(ScanType).indexOf(scanType.toUpperCase());
};

export const sendCommunicationMessage = async (
  body: {},
  communicationString: string,
  client: ClientProxy,
  user?: User,
) => {
  {
    let retryCount = 0;
    let success = false;
    let response = null;

    while (retryCount < 2 && !success) {
      response = await firstValueFrom(
        client
          .send(communicationString, {
            body: encryptData(body),
            user: user ? encryptData(user) : null,
          })
          .pipe(
            catchError((error: any) => {
              console.log(
                '🚀 ~ catchError ~ sendCommunicationMessage ~ error:',
                error,
              );
              if (error.message === 'Connection closed' && retryCount < 1) {
                retryCount++;
                return interval(1000).pipe(take(1), retry(1));
              } else {
                throw new InternalServerErrorException(
                  ERRORS.SOMETHING_WENT_WRONG,
                );
              }
            }),
          ),
      );

      if (response) success = true;
    }
    return response;
  }
};

export const handleError = (error: any) => {
  const { status, statusText, data } = error.response;

  if (status === 400) {
    throw new BadRequestException(data.error);
  } else if (status === 401) {
    throw new UnauthorizedException(statusText);
  } else {
    throw new InternalServerErrorException(ERRORS.SOMETHING_WENT_WRONG);
  }
};

export const headerOptions = (bearerToken: string) => {
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: bearerToken.split(' ')[1],
    },
  };
};

export const createRandomNumberWithDigits = (numberOfDigits = 4) => {
  return Math.floor(Math.random() * 10000)
    .toString()
    .padStart(numberOfDigits, '0');
};

export const getKeyByValue = (value: number, _enum: any) => {
  for (const key in _enum) {
    if (_enum[key] === value) {
      return key;
    }
  }
  return undefined;
};

export const getQueryListParam = (param: any) => {
  return typeof param === 'object' && param?.length
    ? param
    : param
      ? [param]
      : null;
};

export const throwCatchError = (error) => {
  if (error.status === 400) {
    throw new BadRequestException(error.message);
  } else if (error.status === 404) {
    throw new NotFoundException(error.message);
  } else if (error.status === 401) {
    throw new UnauthorizedException(error.message);
  } else {
    throw new InternalServerErrorException(ERRORS.SOMETHING_WENT_WRONG);
  }
};

export const encryptData = (data, object: boolean = true) => {
  if (object) data = JSON.stringify(data);

  const algorithm = 'aes-256-cbc';
  const key = process.env['ENCRYPTION_KEY'];
  const iv = process.env['ENCRYPTION_IV'];

  const cipher = createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return encrypted;
};

export const decryptData = (encryptedData, object: boolean = true) => {
  const algorithm = 'aes-256-cbc';
  const key = process.env['ENCRYPTION_KEY'];
  const iv = process.env['ENCRYPTION_IV'];

  const decipher = createDecipheriv(algorithm, key, iv);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  if (object) decrypted = JSON.parse(decrypted);

  return decrypted;
};

export const checkIfIncidentDivisionsChanged = (
  divisionList1: IncidentDivisionWithIdName[],
  divisionList2: IncidentDivisionWithIdName[],
) => {
  return (
    divisionList1?.map((division) => division.name).join(', ') !==
    divisionList2?.map((division) => division.name).join(', ')
  );
};

// Create Automatic task and attachments of Live Nation Sub-Company's events
export const addTasksAndAttachments = async (
  company_id: number,
  event_id: number,
  user: User,
  transaction?: Transaction,
) => {
  // if company is subcompany of Live Nation Global (14) and it's type is festival
  const isLiveNationParentCompany = await Company.findOne({
    where: {
      id: company_id,
      parent_id: 14,
      category: REQUEST_EVENT_TYPE.FESTIVALS,
    },
    attributes: ['id'],
  });

  if (isLiveNationParentCompany) {
    const eventTemplate = await Template.findOne({
      where: { type: TemplateType.EVENT },
    });

    if (eventTemplate) {
      const eventTaskToBeCreated = eventTemplate.config.tasks.map(
        ({ name, description, attachments }) => {
          return {
            name,
            description,
            event_id,
            completed: false,
            eventSubtasksAttachments: attachments?.length
              ? attachments.map(({ url, name }) => {
                  return {
                    event_id,
                    url,
                    name,
                    creator_type: 'User',
                    creator_id: user.id,
                  };
                })
              : [],
          };
        },
      );

      if (eventTaskToBeCreated.length) {
        await EventSubtasks.bulkCreate(eventTaskToBeCreated, {
          include: [{ association: 'eventSubtasksAttachments' }],
          transaction,
        });
      }
    }
  }
};

export const pushNotificationJsonFormater = (
  user_cell: string[],
  msg: string,
  heading_msg: string,
  data,
  event: Event,
  ios_interruption_level: string,
) => {
  return JSON.stringify({
    data,
    ios_interruption_level,
    android_channel_id: process.env['ANDROID_CHANNEL_ID'],
    importance: 'URGENT',
    app_id: process.env['ONESIGNAL_APP_ID'],
    headings: { en: heading_msg },
    subtitle: { en: event.name },
    contents: { en: msg },
    include_external_user_ids: user_cell,
    channel_for_external_user_ids: 'push',
    additional_data_is_root_payload: true,
    ios_sound: 'notification.wav',
  });
};

export const getIncidentMessageCenterByNumber = async (
  phone_number,
  event_id: number,
  options?: { useMaster?: boolean },
) => {
  const incidentMessageCenter = await IncidentMessageCenter.findOne({
    where: { phone_number, event_id },
    attributes: {
      include: [
        [
          Sequelize.literal(`(
                SELECT CAST(COUNT(DISTINCT conversations.id) AS INTEGER)
                FROM conversations
                INNER JOIN messages ON conversations.message_id = messages.id
                WHERE messages.unread = true
                AND conversations.event_id = ${event_id}
                AND conversations.to_number = "IncidentMessageCenter"."phone_number"
            )`),
          'unread',
        ],
      ],
    },
    ...options,
  });
  if (!incidentMessageCenter)
    throw new NotFoundException(ERRORS.INCIDENT_MESSAGE_CENTER_NOT_FOUND);

  return incidentMessageCenter;
};

export const uploadImage = async (
  file: Express.Multer.File,
  configService: ConfigService,
  companyId?: number,
) => {
  let company: Company;
  let region = configService.get('S3_BUCKET_REGION');
  let bucket = configService.get('AWS_BUCKET_NAME');

  if (!file) throw new BadRequestException(ERRORS.FILE_MISSING);

  if (companyId) {
    company = await Company.findOne({
      where: {
        id: companyId,
      },
      attributes: ['id'],
      include: [
        {
          model: Region,
          as: 'region',
          attributes: ['bucket_name', 'aws_region'],
        },
      ],
      raw: true,
    });

    if (!company) throw new NotFoundException(RESPONSES.notFound('Company'));

    if (company.region) {
      region = company['region.aws_region'];
      bucket = company['region.bucket_name'];
    }
  }

  const { buffer, originalname, mimetype } = file;
  const folder = mimetype.includes('pdf') ? 'pdfs' : 'images';

  const timestamp =
    randomBytes(3).toString('hex') + Math.floor(Date.now() / 1000).toString();

  const s3 = new S3({
    accessKeyId: configService.get('ACCESS_KEY_ID'),
    secretAccessKey: configService.get('SECRET_ACCESS_KEY'),
    region,
  });

  const s3params = {
    Bucket: bucket,
    Key: `${folder}/${
      process.env['ENV'] === 'stage' ? 'stage/' : ''
    }${timestamp}/${originalname}`,
    Body: buffer,
    ACL: 'public-read',
  };

  if (mimetype) {
    s3params['ContentType'] = mimetype;
  }

  const url = await new Promise<any>((resolve, reject) => {
    s3.upload(s3params, (err: Error, data: S3.ManagedUpload.SendData) => {
      if (err) {
        console.log('🚀 ~ UploadService ~ s3.upload ~ err:', err);
        return reject(err);
      }
      resolve(data.Location);
    });
  });

  // Modify the URL to remove the Amazon S3 parts and return the final URL
  // https://ontrackdevelopment.s3.us-west-1.amazonaws.com -> https://cdn.us-west-1.ontrack.co
  return url.replace(
    `${bucket}.s3.${region}.amazonaws.com`,
    `cdn.${region}.ontrack.co`,
  );
};

/**
 * It takes array of objects and array of props to check if array have object with duplicate values
 * @param object
 * @param props
 * @returns array of objects
 */
export const checkIfDuplicateExist = (object: any, props: string[]) => {
  const uniqueSet = new Set();

  const uniqueObjects = [];
  let isDuplicate = false;

  object.forEach((obj: any) => {
    const identifier = props.map((prop) => obj[prop]).join('-');

    if (!uniqueSet.has(identifier)) {
      uniqueSet.add(identifier);
      uniqueObjects.push(obj);
    } else {
      isDuplicate = true;
    }
  });

  return isDuplicate;
};

export function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (match) => match.toUpperCase());
}

export const getArrayInChunks = (array: any[], chunkSize: number) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

export const extractPlainFileNameFromS3Url = (url: string): string | null => {
  // Use a regular expression to match the file name at the end of the URL
  const match = url.match(/[^/]+$/);
  // Decode the URI component to get the plain string
  return match ? decodeURIComponent(match[0]) : null;
};

export const getUserRole = (user: User) => {
  return Number((user as User & { role: string }).role);
};

export const withTryCatch = async <T>(
  // CALLBACKS ARE DYNAMIC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: () => T | Promise<T> | any,
  calledFrom: string = '',
  methodName: string = '',
): Promise<T | null> => {
  try {
    // Attempt to invoke the callback, it can be synchronous or asynchronous
    return await callback();
  } catch (e) {
    // Detailed error logging with stack trace and function names
    // eslint-disable-next-line no-console
    console.error(
      `🚀 ~ Error in ${calledFrom} ~ Method: ${methodName} ~ Error:`,
      e,
    );
    if (e instanceof Error) {
      // eslint-disable-next-line no-console
      console.error('Stack Trace:', e.stack);
    }
    return null; // Return a default response in case of an error
  }
};

export const getUserDetail = async (id: number, company_id: number) => {
  return await User.findOne({
    where: { id },
    attributes: [],
    include: [
      {
        model: UserCompanyRole,
        where: { company_id },
        attributes: ['id'],
      },
    ],
  });
};
