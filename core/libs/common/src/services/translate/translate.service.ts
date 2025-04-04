import { Injectable, Scope } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ChangeLog, User } from '../../models';
import { TranslationLanguages, PolymorphicType } from '../../constants';
import {
  formatCompanyChangeLog,
  formatEventChangeLog,
  formatIncidentChangeLog,
  formatIncidentTypeChangeLog,
  formatTaskChangeLog,
  getEventRegexAttributes,
  getKeyColumnLabel,
  getSubTaskTypeAndName,
} from './helper';
import { convertStringToSnakeCase } from '../../helpers';

@Injectable({ scope: Scope.REQUEST })
export class TranslateService {
  constructor(private readonly i18n: I18nService) {}

  async translateChangeLogs(
    user: User,
    changeLogs: ChangeLog[],
    type: PolymorphicType,
    timezone?: string,
  ): Promise<any[]> {
    const userLanguage = user.language_code;
    let imageName: string;
    let subTask: string;
    let subTaskName: string;
    let cadVersion: string;
    let cadName: string;
    let incidentName: string;

    return Promise.all(
      changeLogs.map(async (log) => {
        let action: string, newValue: string, oldValue: string, name: string;

        // if value is not plain the it will set it plain
        if (log.dataValues) {
          log = log.toJSON();
        }

        // regex for getting image name
        if (log?.column === 'image' || log?.column === 'attachment') {
          const regex = /'([^']+\.[a-zA-Z0-9]+)'/;

          const match = log['text']?.match(regex);
          imageName = match ? match[1] : null;
        }

        // For Task and SubTask Attributes
        if (type === PolymorphicType.TASK) {
          ({ subTask, subTaskName } = getSubTaskTypeAndName(log));
        }

        //For Event Attributes
        if (type === PolymorphicType.EVENT) {
          ({ subTaskName, cadVersion, cadName } = getEventRegexAttributes(log));
        }

        switch (type) {
          case PolymorphicType.INCIDENT:
            ({ action, newValue, oldValue, name } = formatIncidentChangeLog(
              log,
              timezone,
              userLanguage,
              this.i18n,
            ));

            break;

          case PolymorphicType.TASK:
            ({ action, newValue, oldValue, name } = formatTaskChangeLog(
              log,
              timezone,
              subTask,
            ));

            break;

          case PolymorphicType.EVENT:
            ({ action, newValue, oldValue, name } = formatEventChangeLog(
              log,
              subTaskName,
            ));

            break;

          case PolymorphicType.COMPANY:
            ({ action, newValue, oldValue, name } =
              formatCompanyChangeLog(log));

            break;

          case PolymorphicType.INCIDENT_TYPE:
            ({ action, newValue, oldValue, name, incidentName } =
              formatIncidentTypeChangeLog(log));

            break;

          default:
            break;
        }

        const { key, params } = getKeyColumnLabel(
          this.i18n,
          log.column,
          action,
          userLanguage,
          oldValue,
          newValue,
          name,
          type,
          subTaskName,
          imageName,
          cadVersion,
          cadName,
          incidentName,
        );

        log['text'] = this.i18n.t(key, {
          lang: userLanguage,
          args: params,
        });

        return log;
      }),
    );
  }

  async translateSingleChangLogToAllLanguages(
    changeLog: ChangeLog,
    type: PolymorphicType,
    timezone?: string,
  ): Promise<any> {
    let imageName: string;
    let subTask: string;
    let subTaskName: string;
    let cadVersion: string;
    let cadName: string;
    let incidentName: string;

    Object.values(TranslationLanguages).forEach((language) => {
      let action: string, newValue: string, oldValue: string, name: string;

      // regex for getting image name
      if (
        changeLog?.column === 'image ' ||
        changeLog?.column === 'attachment'
      ) {
        const regex = /'([^']+\.[a-zA-Z0-9]+)'/;

        const match = changeLog['text']?.match(regex);
        imageName = match ? match[1] : null;
      }

      // For Task and SubTask Attributes
      if (type === PolymorphicType.TASK) {
        ({ subTask, subTaskName } = getSubTaskTypeAndName(changeLog));
      }

      //For Event Attributes
      if (type === PolymorphicType.EVENT) {
        ({ subTaskName, cadVersion, cadName } =
          getEventRegexAttributes(changeLog));
      }

      switch (type) {
        case PolymorphicType.INCIDENT:
          ({ action, newValue, oldValue, name } = formatIncidentChangeLog(
            changeLog,
            timezone,
            language,
            this.i18n,
          ));

          break;

        case PolymorphicType.TASK:
          ({ action, newValue, oldValue, name } = formatTaskChangeLog(
            changeLog,
            timezone,
            subTask,
          ));

          break;

        case PolymorphicType.EVENT:
          ({ action, newValue, oldValue, name } = formatEventChangeLog(
            changeLog,
            subTaskName,
          ));

          break;

        case PolymorphicType.COMPANY:
          ({ action, newValue, oldValue, name } =
            formatCompanyChangeLog(changeLog));

          break;

        case PolymorphicType.INCIDENT_TYPE:
          ({ action, newValue, oldValue, name, incidentName } =
            formatIncidentTypeChangeLog(changeLog));

          break;

        default:
          break;
      }

      const { key, params } = getKeyColumnLabel(
        this.i18n,
        changeLog.column,
        action,
        language,
        oldValue,
        newValue,
        name,
        type,
        subTaskName,
        imageName,
        cadVersion,
        cadName,
        incidentName,
      );

      changeLog[`text_${convertStringToSnakeCase(language)}`] = this.i18n.t(
        key,
        {
          lang: language,
          args: params,
        },
      );
    });
    return changeLog;
  }
}
