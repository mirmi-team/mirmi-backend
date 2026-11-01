// src/users/entities/user.entity.ts
import { Room } from 'src/rooms/entities/room.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  BeforeInsert,
} from 'typeorm';

export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  username: string;

  @Column()
  room_id: number;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role',
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Column({ default: false })
  can_staying: boolean;

  @Column({ default: 0 })
  total_merit_score: number;

  @Column({ type: 'varchar' })
  password: string;

  // 운영 DB: timestamp without time zone, NULL 허용, default CURRENT_TIMESTAMP
  @CreateDateColumn({ type: 'timestamp', nullable: true })
  created_at: Date;

  @Column({ type: 'int', nullable: true })
  grade: number | null;

  @Column({ type: 'int', nullable: true })
  class_no: number | null;

  @Column({ type: 'varchar', nullable: true })
  profile_image: string | null;

  @Column({
    type: 'enum',
    enum: Gender,
    enumName: 'gender_type',
    nullable: true,
  })
  gender: Gender | null;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @BeforeInsert()
  setCreatedAt() {
    this.created_at = new Date();
  }
}
