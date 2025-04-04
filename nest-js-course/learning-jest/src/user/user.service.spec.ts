import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should return "John Doe" when id is 1', () => {
    expect(service.getUserById(1)).toBe('John Doe');
  });

  it('should return "User not found" when id is not 1', () => {
    expect(service.getUserById(2)).toBe('User not found');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
