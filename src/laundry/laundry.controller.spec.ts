import { Test, TestingModule } from '@nestjs/testing';
import { LaundryController } from './laundry.controller';
import { LaundryService } from './laundry.service';

describe('LaundryController', () => {
  let controller: LaundryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LaundryController],
      providers: [LaundryService],
    }).compile();

    controller = module.get<LaundryController>(LaundryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
