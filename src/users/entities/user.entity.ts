// src/users/entities/user.entity.ts
import { Room } from 'src/rooms/entities/room.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ length: 50 })
  username: string;

  @Column()
  room_id: number;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Column({ default: false })
  can_staying: boolean;

  @Column({ default: 0 })
  total_merit_score: number;

  @Column()
  password: string;

  @CreateDateColumn()
  created_at: Date;

  @Column()
  grade: number;

  @Column()
  class_no: number;

  @Column({ nullable: true })
  profile_image: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;
}
