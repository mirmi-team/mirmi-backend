import { Test, TestingModule } from '@nestjs/testing';
import { ReturnRequestsService } from './return-requests.service';

describe('ReturnRequestsService', () => {
  let service: ReturnRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReturnRequestsService],
    }).compile();

    service = module.get<ReturnRequestsService>(ReturnRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
