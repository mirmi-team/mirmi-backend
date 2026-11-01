import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { localDateTimeTransformer } from 'src/common/transformers/local-datetime.transformer';
import { ReservationStatus } from '../dto/create-laundry.dto';

@Entity('laundry_request')
export class LaundryRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  laundry_id: number;

  @Column()
  user_id: number;

  @Column()
  room_number: number;

  @Column({ type: 'timestamp', transformer: localDateTimeTransformer })
  start_time: string;

  @Column({ type: 'timestamp', transformer: localDateTimeTransformer })
  end_time: string;

  @Column({ type: 'varchar' })
  status: ReservationStatus;
}
