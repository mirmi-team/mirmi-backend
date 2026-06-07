import { Test, TestingModule } from '@nestjs/testing';
import { MeritLogsController } from './merit-logs.controller';
import { MeritLogsService } from './merit-logs.service';

describe('MeritLogsController', () => {
  let controller: MeritLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeritLogsController],
      providers: [MeritLogsService],
    }).compile();

    controller = module.get<MeritLogsController>(MeritLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
