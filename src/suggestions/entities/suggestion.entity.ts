import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum SuggestionCategory {
  FACILITY = 'FACILITY',
  OPERATION = 'OPERATION',
  MEAL = 'MEAL',
  CLEANING = 'CLEANING',
  SAFETY = 'SAFETY',
  NOISE = 'NOISE',
  ETC = 'ETC',
}

@Entity('suggestion')
export class Suggestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  created_by: number;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: SuggestionCategory,
    enumName: 'suggestion_category',
  })
  category: SuggestionCategory;

  @Column('text', { nullable: true })
  reply: string | null;

  @CreateDateColumn()
  created_at: Date;
}
