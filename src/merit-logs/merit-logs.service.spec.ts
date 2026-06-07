import { Test, TestingModule } from '@nestjs/testing';
import { MeritLogsService } from './merit-logs.service';

describe('MeritLogsService', () => {
  let service: MeritLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MeritLogsService],
    }).compile();

    service = module.get<MeritLogsService>(MeritLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
