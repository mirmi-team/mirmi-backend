// src/merit-logs/entities/merit-log.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum MeritType {
  PENALTY = 'PENALTY',
  REWARD = 'REWARD',
}

@Entity('merit_logs')
export class MeritLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ type: 'enum', enum: MeritType })
  type: MeritType;

  @Column()
  score: number;

  @Column()
  reason: string;

  @CreateDateColumn()
  created_at: Date;
}
