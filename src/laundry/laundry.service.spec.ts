import { Test, TestingModule } from '@nestjs/testing';
import { LaundryService } from './laundry.service';

describe('LaundryService', () => {
  let service: LaundryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LaundryService],
    }).compile();

    service = module.get<LaundryService>(LaundryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
