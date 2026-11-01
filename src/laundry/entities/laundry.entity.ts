import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LaundryMachineStatus } from '../dto/update-laundry.dto';

@Entity('laundry')
export class Laundry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  status: LaundryMachineStatus;

  @Column()
  floor: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
