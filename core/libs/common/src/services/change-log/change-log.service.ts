import { Injectable } from '@nestjs/common';
import { PolymorphicType, SortBy } from '../../constants';
import {
  calculatePagination,
  formatUserInResponse,
  getPageAndPageSize,
  processTimeStamp,
} from '../../helpers';
import { PusherService, TranslateService } from '..';
import { ChangeLog, User } from '../../models';
import { AppInjector } from '../../controllers';
import { GetChangeLogDto } from './dto/get-change-log.dto';
import { CreateChangeLogDto } from './dto/create-change-log.dto';
import { changeLogsWhere } from './helpers';

@Injectable()
export class ChangeLogService {
  constructor(private readonly pusherService: PusherService) {}

  public async getChangeLogs(getChangeLogs: GetChangeLogDto & { where?: any }) {
    const { page, page_size, where } = getChangeLogs;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    const changeLogs = await ChangeLog.findAndCountAll({
      where: { ...changeLogsWhere(getChangeLogs), ...where },
      attributes: [
        'id',
        'old_value',
        'new_value',
        'formatted_log_text',
        'parent_changed_at',
        'created_at',
        'column',
        'editor_id',
        'additional_values',
      ],
      include: [
        {
          model: User,
          attributes: ['id', 'cell', 'name'],
        },
      ],
      order: [['createdAt', SortBy.DESC]],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
    });

    const { rows, count } = changeLogs;

    /**
     * The map method then further transforms the plain JavaScript object by destructuring the object and assigning certain properties to new keys, such as id and text
     * Additionally, it calls the formatUserInResponse function to add a new property to each object in the array based on the users property of the original object.
     */
    return {
      data: rows.map((item) => {
        const { users, id, formatted_log_text, ...changeLog } = item.get({
          plain: true,
        });
        return {
          id: Number(id),
          text: formatted_log_text,
          ...changeLog,
          ...formatUserInResponse(users?.name || 'N/A', 'Logs'),
        };
      }),
      pagination: calculatePagination(count, _page_size, _page),
    };
  }

  public async createChangeLog(createChangeLogDto: CreateChangeLogDto) {
    const {
      column,
      formatted_log_text,
      editor_id,
      editor_type,
      old_value,
      new_value,
      id,
      type,
      additional_values,
    } = createChangeLogDto;

    let changeLog = await ChangeLog.create(
      {
        column,
        formatted_log_text,
        editor_id,
        editor_type,
        old_value,
        new_value,
        change_logable_id: +id,
        change_logable_type: type,
        parent_changed_at: Date.now(),
        additional_values,
      },
      { raw: true },
    );

    changeLog = await changeLog.get({ plain: true });
    changeLog['text'] = changeLog.formatted_log_text;
    changeLog['type'] = 'Logs';
    changeLog['commented_by'] = createChangeLogDto.commented_by;
    changeLog['editor_name'] = createChangeLogDto.commented_by;
    changeLog['additional_values'] = additional_values;

    if (type === PolymorphicType.INCIDENT && column === 'dispatched') {
      const translateService = await AppInjector.resolve(TranslateService);

      changeLog = await translateService.translateSingleChangLogToAllLanguages(
        changeLog,
        PolymorphicType.INCIDENT,
      );
    }

    delete changeLog.formatted_log_text;

    // change_log_pusher_service
    this.pusherService.sendUpdatedChangelog(
      processTimeStamp(changeLog),
      createChangeLogDto.type,
    );
  }
}
