// src/merit-logs/entities/merit-reason.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { MeritType } from './merit-log.entity';

@Entity('merit_reasons')
export class MeritReason {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: MeritType })
  type: MeritType;

  @Column()
  reason: string;

  @Column()
  default_score: number;
}
