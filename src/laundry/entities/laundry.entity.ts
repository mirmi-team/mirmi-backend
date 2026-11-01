import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { localDateTimeTransformer } from 'src/common/transformers/local-datetime.transformer';
import { LaundryMachineStatus } from '../dto/update-laundry.dto';

@Entity('laundry')
export class Laundry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  status: LaundryMachineStatus;

  @Column()
  floor: number;

  @Column({ type: 'timestamp', transformer: localDateTimeTransformer })
  created_at: string;
}
