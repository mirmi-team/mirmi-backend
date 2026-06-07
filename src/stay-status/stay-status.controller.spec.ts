import { Test, TestingModule } from '@nestjs/testing';
import { StayStatusController } from './stay-status.controller';
import { StayStatusService } from './stay-status.service';

describe('StayStatusController', () => {
  let controller: StayStatusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StayStatusController],
      providers: [StayStatusService],
    }).compile();

    controller = module.get<StayStatusController>(StayStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
