import { Test, TestingModule } from '@nestjs/testing';
import { CleaningDutyService } from './cleaning-duty.service';

describe('CleaningDutyService', () => {
  let service: CleaningDutyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CleaningDutyService],
    }).compile();

    service = module.get<CleaningDutyService>(CleaningDutyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
