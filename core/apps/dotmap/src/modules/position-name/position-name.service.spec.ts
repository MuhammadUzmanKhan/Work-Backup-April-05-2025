import { Test, TestingModule } from '@nestjs/testing';
import { PositionName } from '@ontrack-tech-group/common/models';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { userFixture } from '@ontrack-tech-group/common/fixtures';
import {
  checkIfWithinScope,
  getNameAndCompanyWhere,
  commonEventCheckInclude,
} from '@Common/helpers';
import { NameCompanyDto } from '@Common/dto';
import { PositionNameService } from './position-name.service';

// Mock external dependencies
jest.mock('@Common/helpers', () => ({
  checkIfWithinScope: jest.fn(),
  getNameAndCompanyWhere: jest.fn(),
  commonEventCheckInclude: jest.fn(),
}));

jest.mock('@ontrack-tech-group/common/models', () => ({
  PositionName: {
    findAll: jest.fn(),
  },
}));

describe('PositionNameService', () => {
  let service: PositionNameService;

  const mockUser = userFixture.create();
  const nameCompanyDto = new NameCompanyDto();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PositionNameService],
    }).compile();

    service = module.get<PositionNameService>(PositionNameService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPositionNames', () => {
    it('should call necessary helper functions and findAll with correct params', async () => {
      // Mock helper functions
      const mockWhereClause = {
        company_id: 1,
        name: { [Symbol.for('Op.iLike')]: '%Position Name%' },
      };

      const mockInclude = [
        { model: {}, where: { event_id: 123 }, attributes: [] },
      ];

      const mockPositionNames = [
        { id: 1, name: 'Position Name 1', company_id: 1 },
      ];

      (checkIfWithinScope as jest.Mock).mockResolvedValue(true);
      (getNameAndCompanyWhere as jest.Mock).mockReturnValue(mockWhereClause);
      (commonEventCheckInclude as jest.Mock).mockReturnValue(mockInclude);
      (PositionName.findAll as jest.Mock).mockResolvedValue(mockPositionNames);

      // Call the service method
      const result = await service.getAllPositionNames(
        nameCompanyDto,
        mockUser,
      );

      // Assertions
      expect(checkIfWithinScope).toHaveBeenCalledWith(nameCompanyDto, mockUser);
      expect(getNameAndCompanyWhere).toHaveBeenCalledWith(nameCompanyDto);
      expect(commonEventCheckInclude).toHaveBeenCalledWith(
        nameCompanyDto.event_id,
      );

      expect(PositionName.findAll).toHaveBeenCalledWith({
        where: mockWhereClause,
        attributes: ['id', 'name', 'company_id'],
        order: [['name', SortBy.ASC]],
        include: mockInclude,
      });

      // Check result
      expect(result).toEqual(mockPositionNames);
    });

    it('should call necessary helper functions and findAll with Position Name query not found any position names', async () => {
      // Mock helper functions
      const mockWhereClause = {
        company_id: 1,
        name: { [Symbol.for('Op.iLike')]: '%Position Name%' },
      };

      const mockInclude = [
        { model: {}, where: { event_id: 123 }, attributes: [] },
      ];

      const mockPositionNames = [];

      (checkIfWithinScope as jest.Mock).mockResolvedValue(true);
      (getNameAndCompanyWhere as jest.Mock).mockReturnValue(mockWhereClause);
      (commonEventCheckInclude as jest.Mock).mockReturnValue(mockInclude);
      (PositionName.findAll as jest.Mock).mockResolvedValue(mockPositionNames);

      // Call the service method
      const result = await service.getAllPositionNames(
        nameCompanyDto,
        mockUser,
      );

      // Assertions
      expect(checkIfWithinScope).toHaveBeenCalledWith(nameCompanyDto, mockUser);
      expect(getNameAndCompanyWhere).toHaveBeenCalledWith(nameCompanyDto);
      expect(commonEventCheckInclude).toHaveBeenCalledWith(
        nameCompanyDto.event_id,
      );

      expect(PositionName.findAll).toHaveBeenCalledWith({
        where: mockWhereClause,
        attributes: ['id', 'name', 'company_id'],
        order: [['name', SortBy.ASC]],
        include: mockInclude,
      });

      // Check result
      expect(result).toEqual(mockPositionNames);
    });
  });
});
