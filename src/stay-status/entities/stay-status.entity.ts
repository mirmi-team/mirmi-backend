// src/stay-status/entities/stay-status.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

export enum StayStatusType {
  STAY = 'STAY',
  OUTING = 'OUTING',
}

@Entity('stay_status')
export class StayStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ type: 'varchar', length: 10 })
  status: StayStatusType;

  @Column({ type: 'date' })
  week_start: string;

  @UpdateDateColumn()
  updated_at: Date;
}
