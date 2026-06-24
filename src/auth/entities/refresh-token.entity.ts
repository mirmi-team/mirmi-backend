import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ type: 'varchar', length: 60 }) //
  token_hash: string;

  @Column()
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  device_info: string;
}
