import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('laundry_fixed_schedule')
export class LaundryFixedSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  floor: number;

  @Column({ type: 'varchar' })
  day_of_week: string;

  @Column()
  machine_no: number;

  // time 컬럼은 'HH:MM:SS' 문자열로 반환된다
  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ type: 'int', nullable: true })
  assigned_room: number | null;

  // 슬롯 하나에 호실 2개가 배정되는 경우(둘이 순서를 합의해서 쓰는 경우)를 위한 필드.
  // 단독 배정이면 null.
  @Column({ type: 'int', nullable: true })
  assigned_room_2: number | null;
}
