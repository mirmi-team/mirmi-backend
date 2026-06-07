import { Test, TestingModule } from '@nestjs/testing';
import { MorningSongsController } from './morning-songs.controller';
import { MorningSongsService } from './morning-songs.service';

describe('MorningSongsController', () => {
  let controller: MorningSongsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MorningSongsController],
      providers: [MorningSongsService],
    }).compile();

    controller = module.get<MorningSongsController>(MorningSongsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
