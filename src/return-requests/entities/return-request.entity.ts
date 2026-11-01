import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { localDateTimeTransformer } from 'src/common/transformers/local-datetime.transformer';
import { ReturnType } from '../dto/create-return-request.dto';

@Entity('return_requests')
export class ReturnRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({
    type: 'enum',
    enum: ReturnType,
    enumName: 'return_type_enum',
    nullable: true,
  })
  return_type: ReturnType | null;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    transformer: localDateTimeTransformer,
  })
  actual_return_time: string | null;

  // date 컬럼은 'YYYY-MM-DD' 문자열로 반환된다
  @Column({ type: 'date' })
  request_date: string;
}
