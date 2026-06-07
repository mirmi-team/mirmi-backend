import { Test, TestingModule } from '@nestjs/testing';
import { CleaningDutyController } from './cleaning-duty.controller';
import { CleaningDutyService } from './cleaning-duty.service';

describe('CleaningDutyController', () => {
  let controller: CleaningDutyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CleaningDutyController],
      providers: [CleaningDutyService],
    }).compile();

    controller = module.get<CleaningDutyController>(CleaningDutyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
