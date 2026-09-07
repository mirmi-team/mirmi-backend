// src/morning-songs/entities/morning-song.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
} from 'typeorm';

@Entity('morning_songs')
export class MorningSong {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  song_name: string;

  @Column()
  youtube_url: string;

  @Column({ nullable: true })
  thumbnail: string;

  @Column({ type: 'date' })
  play_date: string;

  @Column({ type: 'int', nullable: true })
  play_order: number;

  @CreateDateColumn()
  created_at: Date;

  @BeforeInsert()
  setCreatedAt() {
    this.created_at = new Date();
  }
}
