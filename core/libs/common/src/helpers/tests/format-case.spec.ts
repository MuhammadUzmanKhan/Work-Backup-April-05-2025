import {
  convertStringToSnakeCase,
  getHumanizeTitleCaseEnum,
  humanizeTitleCase,
} from '../format-case';

describe('helper', () => {
  describe('format-case', () => {
    it('should capatalize first letter', () => {
      expect(humanizeTitleCase('ontrack')).toBe('Ontrack');
    });

    it('should convert case to snake', () => {
      expect(convertStringToSnakeCase('ontrack common')).toBe('ontrack_common');
    });

    it('should convert enum to keys', () => {
      enum RolesEnum {
        SUPER_ADMIN = 'super_admin',
        ADMIN = 'admin',
        DRIVER = 'driver',
        MANAGER = 'manager',
        SCANNER = 'scanner',
        VENDOR = 'vendor',
        CAMPING_ADMIN = 'camping_admin',
        CAMPING_MANAGER = 'camping_manager',
        VENDOR_STAFF = 'vendor_staff',
        TRANSPORT_MANAGER = 'transport_manager',
        TRANSPORT_DISPATCHER = 'transport_dispatcher',
        CAMPING_DISPATCHER = 'camping_dispatcher',
        INCIDENT_MANAGER = 'incident_manager',
        INCIDENT_DISPATCHER = 'incident_dispatcher',
        SERVICE_MANAGER = 'service_manager',
        SERVICE_DISPATCHER = 'service_dispatcher',
        GLOBAL_ADMIN = 'global_admin',
        GLOBAL_MANAGER = 'global_manager',
        ONTRACK_MANAGER = 'ontrack_manager',
        WORKFORCE_MANAGER = 'workforce_manager',
        OPERATIONS_MANAGER = 'operations_manager',
        CAMERA_VENDOR = 'camera_vendor',
        REGIONAL_MANAGER = 'regional_manager',
        REGIONAL_ADMIN = 'regional_admin',
        REFERENCE_USER = 'reference_user',
      }
      expect(getHumanizeTitleCaseEnum(RolesEnum)).toStrictEqual([
        'Super Admin',
        'Admin',
        'Driver',
        'Manager',
        'Scanner',
        'Vendor',
        'Camping Admin',
        'Camping Manager',
        'Vendor Staff',
        'Transport Manager',
        'Transport Dispatcher',
        'Camping Dispatcher',
        'Incident Manager',
        'Incident Dispatcher',
        'Service Manager',
        'Service Dispatcher',
        'Global Admin',
        'Global Manager',
        'Ontrack Manager',
        'Workforce Manager',
        'Operations Manager',
        'Camera Vendor',
        'Regional Manager',
        'Regional Admin',
        'Reference User',
      ]);
    });
  });
});
