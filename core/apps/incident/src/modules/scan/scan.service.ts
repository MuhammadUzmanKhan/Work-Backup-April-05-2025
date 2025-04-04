import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import {
  ERRORS,
  RESPONSES,
  ScanType,
  ScanTypeNumber,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { Incident, Scan, User } from '@ontrack-tech-group/common/models';
import {
  calculatePagination,
  getIndexOfScanType,
  getPageAndPageSize,
  isDepartmentExist,
  isUserExist,
  throwCatchError,
  withCompanyScope,
  withTryCatch,
} from '@ontrack-tech-group/common/helpers';
import {
  ChangeLogService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { UserService } from '@Modules/user/user.service';
import { isIncidentExist } from '@Modules/incident/helpers';
import {
  sendDispatchedStaffData,
  sendDispatchLogUpdate,
  sendIncidentUpdate,
} from '@Modules/incident/helpers/sockets';
import { IncidentService } from '@Modules/incident/incident.service';
import { createChangelogForDispatchStaff } from '@Common/helpers';
import {
  CreateIncidentUserScanDto,
  CreateScanByStaffAndEventIdDto,
  GetScanByStaffAndEventIdDto,
} from './dto';
import {
  createUpdateLocation,
  getBasicAttributesOfScan,
  getCreatedOrUpdatedScan,
  getScanByStaffIdWhere,
} from './helper';

@Injectable()
export class ScanService {
  constructor(
    private readonly userService: UserService,
    private readonly changeLogService: ChangeLogService,
    private readonly sequelize: Sequelize,
    private readonly pusherService: PusherService,
    private readonly incidentService: IncidentService,
  ) {}

  /**
   * First, it uses the Object.entries() method to convert the ScanType enum into an array of arrays, where each inner array contains the key-value pairs of the enum.
   * Then, it uses the map() method to transform each inner array into an object with the desired format. The value of each inner array is used as the scan_type property of the resulting object. The index of each inner array is used as the scan_type_id property of the resulting object. The key of each inner array is used as the scan_type_name property of the resulting object.
   * The scan_type_name property is transformed using the replace() method with a regular expression to replace underscores with spaces and the toUpperCase() method to capitalize the first letter of each word in the resulting string.
   *
   * By using [_, value] as the parameter in the map function, you are indicating that you are intentionally ignoring the key variable and only using the value and index variables.
   * @returns the function returns the array of formatted objects containing the scan_type, scan_type_id, and scan_type_name properties for each scan type in the ScanType enum.
   */
  getAllScanTypes() {
    const formattedScanTypes = Object.entries(ScanType);

    return formattedScanTypes.map(([, value], index) => ({
      scan_type: value,
      scan_type_id: index,
      scan_type_name: value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter: string) => letter.toUpperCase()),
    }));
  }

  async createScanByStaffId(
    createScanDto: CreateScanByStaffAndEventIdDto,
    user: User,
  ) {
    const { event_id, user_id, scan_type } = createScanDto;

    await this.userService.getUserById(user_id);

    const scan = await Scan.create({
      event_id,
      user_id,
      scanner_id: user.id,
      scan_type: getIndexOfScanType(scan_type),
    });

    if (!scan)
      throw new UnprocessableEntityException('Scan could not be created.'); //TODO

    await createUpdateLocation(createScanDto, scan);

    return await getCreatedOrUpdatedScan(scan.id, { useMaster: true });
  }

  async createScanForIncidentStaff(
    currentUser: User,
    createIncidentScan: CreateIncidentUserScanDto,
  ) {
    const { event_id, incident_id, scan_type, department_id, user_id } =
      createIncidentScan;

    const [, divisionLockService] = await withCompanyScope(
      currentUser,
      event_id,
    );

    // checking is incident exist or not
    await isIncidentExist(incident_id, currentUser);

    const user = await isUserExist(user_id);

    await isDepartmentExist(department_id);

    const transaction = await this.sequelize.transaction();

    try {
      await Scan.create(
        {
          ...createIncidentScan,
          created_by: currentUser.id,
          scan_type: ScanTypeNumber[scan_type.toUpperCase()],
        },
        { transaction },
      );

      //webhooks after scan creation from rails side

      await Incident.update(
        {
          updated_by: currentUser.id,
          updated_by_type: 'User',
        },
        { where: { id: incident_id }, transaction },
      );

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throwCatchError(e);
    }

    const updatedIncident = await this.incidentService.getIncidentById(
      incident_id,
      event_id,
      currentUser,
    );

    sendIncidentUpdate(
      updatedIncident,
      event_id,
      false, // isNew flag
      this.pusherService,
      false, // isUpload flag
      divisionLockService,
    );

    createChangelogForDispatchStaff(
      currentUser,
      incident_id,
      department_id,
      event_id,
      user,
      this.changeLogService,
    );

    sendDispatchLogUpdate(
      incident_id,
      [user_id],
      event_id,
      this.pusherService,
      false,
    );

    withTryCatch(
      async () => {
        sendDispatchedStaffData([user_id], event_id, this.pusherService);
      },
      'IncidentService',
      'sendDispatchedStaffData',
    );

    return { message: RESPONSES.createdSuccessfully('Scan') };
  }

  async getScansByStaffId(
    getScanByStaffAndEventIdDto: GetScanByStaffAndEventIdDto,
  ) {
    const { user_id, page, page_size, sort_column, order } =
      getScanByStaffAndEventIdDto;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    await this.userService.getUserById(user_id);

    const scans = await Scan.findAndCountAll({
      where: getScanByStaffIdWhere(getScanByStaffAndEventIdDto),
      attributes: [
        ...getBasicAttributesOfScan,
        [Scan.getFormattedScanTypeByKey, 'scan_type'],
      ],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
      order: [[sort_column || 'createdAt', order || SortBy.DESC]],
    });

    const { rows, count } = scans;
    return {
      data: rows,
      pagination: calculatePagination(count, page_size, page),
    };
  }

  async enableOrDisableScan(scanId: number) {
    const scan = await Scan.findByPk(scanId, { attributes: ['id', 'enabled'] });
    if (!scan) throw new NotFoundException(ERRORS.SCAN_NOT_FOUND);

    await scan.update({ enabled: !scan.enabled }, { where: { id: scanId } });

    return scan;
  }
}
