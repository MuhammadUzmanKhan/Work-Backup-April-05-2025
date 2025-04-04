import { Test, TestingModule } from '@nestjs/testing';
import { Area } from '@ontrack-tech-group/common/models';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { userFixture } from '@ontrack-tech-group/common/fixtures';
import {
  checkIfWithinScope,
  getNameAndCompanyWhere,
  commonEventCheckInclude,
} from '@Common/helpers';
import { NameCompanyDto } from '@Common/dto';
import { AreaService } from './area.service';

// Mock external dependencies
jest.mock('@Common/helpers', () => ({
  checkIfWithinScope: jest.fn(),
  getNameAndCompanyWhere: jest.fn(),
  commonEventCheckInclude: jest.fn(),
}));

jest.mock('@ontrack-tech-group/common/models', () => ({
  Area: {
    findAll: jest.fn(),
  },
}));

describe('AreaService', () => {
  let service: AreaService;

  const mockUser = userFixture.create();
  const nameCompanyDto = new NameCompanyDto();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AreaService],
    }).compile();

    service = module.get<AreaService>(AreaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAreas', () => {
    it('should call necessary helper functions and findAll with correct params', async () => {
      // Mock helper functions
      const mockWhereClause = {
        company_id: 1,
        name: { [Symbol.for('Op.iLike')]: '%Area%' },
      };

      const mockInclude = [
        { model: {}, where: { event_id: 123 }, attributes: [] },
      ];

      const mockAreas = [{ id: 1, name: 'Area 1', company_id: 1 }];

      (checkIfWithinScope as jest.Mock).mockResolvedValue(true);
      (getNameAndCompanyWhere as jest.Mock).mockReturnValue(mockWhereClause);
      (commonEventCheckInclude as jest.Mock).mockReturnValue(mockInclude);
      (Area.findAll as jest.Mock).mockResolvedValue(mockAreas);

      // Call the service method
      const result = await service.getAllAreas(nameCompanyDto, mockUser);

      // Assertions
      expect(checkIfWithinScope).toHaveBeenCalledWith(nameCompanyDto, mockUser);
      expect(getNameAndCompanyWhere).toHaveBeenCalledWith(nameCompanyDto);
      expect(commonEventCheckInclude).toHaveBeenCalledWith(
        nameCompanyDto.event_id,
      );

      expect(Area.findAll).toHaveBeenCalledWith({
        where: mockWhereClause,
        attributes: ['id', 'name', 'company_id'],
        order: [['name', SortBy.ASC]],
        include: mockInclude,
      });

      // Check result
      expect(result).toEqual(mockAreas);
    });

    it('should call necessary helper functions and findAll with Area query not found any areas', async () => {
      // Mock helper functions
      const mockWhereClause = {
        company_id: 1,
        name: { [Symbol.for('Op.iLike')]: '%Area%' },
      };

      const mockInclude = [
        { model: {}, where: { event_id: 123 }, attributes: [] },
      ];

      const mockAreas = [];

      (checkIfWithinScope as jest.Mock).mockResolvedValue(true);
      (getNameAndCompanyWhere as jest.Mock).mockReturnValue(mockWhereClause);
      (commonEventCheckInclude as jest.Mock).mockReturnValue(mockInclude);
      (Area.findAll as jest.Mock).mockResolvedValue(mockAreas);

      // Call the service method
      const result = await service.getAllAreas(nameCompanyDto, mockUser);

      // Assertions
      expect(checkIfWithinScope).toHaveBeenCalledWith(nameCompanyDto, mockUser);
      expect(getNameAndCompanyWhere).toHaveBeenCalledWith(nameCompanyDto);
      expect(commonEventCheckInclude).toHaveBeenCalledWith(
        nameCompanyDto.event_id,
      );

      expect(Area.findAll).toHaveBeenCalledWith({
        where: mockWhereClause,
        attributes: ['id', 'name', 'company_id'],
        order: [['name', SortBy.ASC]],
        include: mockInclude,
      });

      // Check result
      expect(result).toEqual(mockAreas);
    });
  });
});
