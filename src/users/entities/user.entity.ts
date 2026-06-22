// src/users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
// import { Room } from '../../rooms/entities/room.entity';

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

  // 관계 설정: 여러 user가 하나의 room에 속함
  //   @ManyToOne(() => Room)
  //   @JoinColumn({ name: 'room_id' })
  //   room: Room;
}
