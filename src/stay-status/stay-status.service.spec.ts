import { Test, TestingModule } from '@nestjs/testing';
import { StayStatusService } from './stay-status.service';

describe('StayStatusService', () => {
  let service: StayStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StayStatusService],
    }).compile();

    service = module.get<StayStatusService>(StayStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
