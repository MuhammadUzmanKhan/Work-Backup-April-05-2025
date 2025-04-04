import { Test, TestingModule } from '@nestjs/testing';
import { Position } from '@ontrack-tech-group/common/models';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { userFixture } from '@ontrack-tech-group/common/fixtures';
import {
  checkIfWithinScope,
  getNameAndCompanyWhere,
  commonEventCheckInclude,
} from '@Common/helpers';
import { NameCompanyDto } from '@Common/dto';
import { PositionService } from './position.service';

// Mock external dependencies
jest.mock('@Common/helpers', () => ({
  checkIfWithinScope: jest.fn(),
  getNameAndCompanyWhere: jest.fn(),
  commonEventCheckInclude: jest.fn(),
}));

jest.mock('@ontrack-tech-group/common/models', () => ({
  Position: {
    findAll: jest.fn(),
  },
}));

describe('PositionService', () => {
  let service: PositionService;

  const mockUser = userFixture.create();
  const nameCompanyDto = new NameCompanyDto();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PositionService],
    }).compile();

    service = module.get<PositionService>(PositionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPositions', () => {
    it('should call necessary helper functions and findAll with correct params', async () => {
      // Mock helper functions
      const mockWhereClause = {
        company_id: 1,
        name: { [Symbol.for('Op.iLike')]: '%Position%' },
      };

      const mockInclude = [
        { model: {}, where: { event_id: 123 }, attributes: [] },
      ];

      const mockPositions = [{ id: 1, name: 'Position 1', company_id: 1 }];

      (checkIfWithinScope as jest.Mock).mockResolvedValue(true);
      (getNameAndCompanyWhere as jest.Mock).mockReturnValue(mockWhereClause);
      (commonEventCheckInclude as jest.Mock).mockReturnValue(mockInclude);
      (Position.findAll as jest.Mock).mockResolvedValue(mockPositions);

      // Call the service method
      const result = await service.getAllPositions(nameCompanyDto, mockUser);

      // Assertions
      expect(checkIfWithinScope).toHaveBeenCalledWith(nameCompanyDto, mockUser);
      expect(getNameAndCompanyWhere).toHaveBeenCalledWith(nameCompanyDto);
      expect(commonEventCheckInclude).toHaveBeenCalledWith(
        nameCompanyDto.event_id,
      );

      expect(Position.findAll).toHaveBeenCalledWith({
        where: mockWhereClause,
        attributes: ['id', 'name', 'company_id'],
        order: [['name', SortBy.ASC]],
        include: mockInclude,
      });

      // Check result
      expect(result).toEqual(mockPositions);
    });

    it('should call necessary helper functions and findAll with Position query not found any positions', async () => {
      // Mock helper functions
      const mockWhereClause = {
        company_id: 1,
        name: { [Symbol.for('Op.iLike')]: '%Position%' },
      };

      const mockInclude = [
        { model: {}, where: { event_id: 123 }, attributes: [] },
      ];

      const mockPositions = [];

      (checkIfWithinScope as jest.Mock).mockResolvedValue(true);
      (getNameAndCompanyWhere as jest.Mock).mockReturnValue(mockWhereClause);
      (commonEventCheckInclude as jest.Mock).mockReturnValue(mockInclude);
      (Position.findAll as jest.Mock).mockResolvedValue(mockPositions);

      // Call the service method
      const result = await service.getAllPositions(nameCompanyDto, mockUser);

      // Assertions
      expect(checkIfWithinScope).toHaveBeenCalledWith(nameCompanyDto, mockUser);
      expect(getNameAndCompanyWhere).toHaveBeenCalledWith(nameCompanyDto);
      expect(commonEventCheckInclude).toHaveBeenCalledWith(
        nameCompanyDto.event_id,
      );

      expect(Position.findAll).toHaveBeenCalledWith({
        where: mockWhereClause,
        attributes: ['id', 'name', 'company_id'],
        order: [['name', SortBy.ASC]],
        include: mockInclude,
      });

      // Check result
      expect(result).toEqual(mockPositions);
    });
  });
});
