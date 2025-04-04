/**
 * This file contains all the helper functions related to change logs
 */

import { ConfigService } from '@nestjs/config';
import { Transaction } from 'sequelize';
import { Editor, PolymorphicType } from '../constants';
import { ChangeLog } from '../models';
import { PusherService, TranslateService } from '../services';
import { processTimeStamp } from '.';
import { AppInjector } from '../controllers';

// Utility function to handle transaction after commit
export const handleAfterCommit = async (
  transaction: Transaction,
  callback: () => Promise<void>,
) => {
  transaction.afterCommit(async () => {
    try {
      await callback();
    } catch (err) {
      console.error('🚀 ~ Transaction.afterCommit ~ err:', err);
    }
  });
};

// Utility function to create a change log
export const createChangeLog = async (
  changelog: any,
  editor: Editor,
  polymorphicType: PolymorphicType,
) => {
  const createdChangeLog = await ChangeLog.create(changelog);

  await sendChangeLogUpdate(createdChangeLog, editor, polymorphicType);
};

// Utility function to send change log updates
export const sendChangeLogUpdate = async (
  changeLog: any,
  editor: Editor,
  polymorphicType: PolymorphicType,
  timeZone?: string,
) => {
  const pusherService = new PusherService(new ConfigService());
  let changeLogPlain;

  // Prepare the change log for sending
  changeLogPlain = changeLog.get({ plain: true });
  changeLogPlain['text'] = changeLogPlain.formatted_log_text;
  changeLogPlain['commented_by'] = editor.editor_name;
  changeLogPlain['editor_name'] = editor.editor_name;

  if (
    polymorphicType === PolymorphicType.TASK ||
    polymorphicType === PolymorphicType.EVENT ||
    polymorphicType === PolymorphicType.COMPANY ||
    polymorphicType === PolymorphicType.LEGAL_GROUP ||
    polymorphicType === PolymorphicType.INCIDENT_TYPE
  ) {
    const translateService = await AppInjector.resolve(TranslateService);

    changeLogPlain =
      await translateService.translateSingleChangLogToAllLanguages(
        changeLogPlain,
        polymorphicType,
        polymorphicType === PolymorphicType.TASK || PolymorphicType.LEGAL_GROUP
          ? timeZone
          : null,
      );
  }

  delete changeLogPlain.formatted_log_text;

  try {
    // Send the change log update notification
    pusherService.sendUpdatedChangelog(
      processTimeStamp(changeLogPlain),
      polymorphicType,
    );
  } catch (err) {
    console.log('🚀 ~ Error in sendChangeLogUpdate:', err);
  }
};
