import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
} from 'typeorm';

@Entity('email_verifications')
export class EmailVerification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  verification_code: string;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ nullable: true })
  verified_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @Column()
  expires_at: Date;

  @BeforeInsert()
  setCreatedAt() {
    this.created_at = new Date();
  }
}
