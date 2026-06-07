import { Test, TestingModule } from '@nestjs/testing';
import { MorningSongsService } from './morning-songs.service';

describe('MorningSongsService', () => {
  let service: MorningSongsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MorningSongsService],
    }).compile();

    service = module.get<MorningSongsService>(MorningSongsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
