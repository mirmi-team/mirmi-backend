import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Room } from 'src/rooms/entities/room.entity';

@Entity('cleaning_duty')
export class CleaningDuty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  room_id: number;

  @ManyToOne(() => Room, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'room_id' })
  room: Room | null;

  @Column({ type: 'timestamp' })
  duty_date: Date;

  @Column({ type: 'varchar' })
  status: string;
}
