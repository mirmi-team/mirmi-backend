import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('dormitory_schedule')
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column('text')
  description: string;

  // date 컬럼은 TypeORM이 'YYYY-MM-DD' 문자열로 반환한다
  @Column({ type: 'date' })
  schedule_date: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
