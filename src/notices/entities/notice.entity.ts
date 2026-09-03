import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
} from 'typeorm';

@Entity('notices')
export class Notice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true, type: 'varchar' })
  image_url: string | null;

  @BeforeInsert()
  setCreatedAt() {
    this.created_at = new Date();
  }
}
