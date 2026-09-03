import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  room_number: number;

  @Column({ nullable: true })
  floor: number;

  @CreateDateColumn()
  created_at: Date;

  @BeforeInsert()
  setCreatedAt() {
    this.created_at = new Date();
  }
}
