import { ValueTransformer } from 'typeorm';

const pad = (n: number) => String(n).padStart(2, '0');

// timestamp(without time zone) 컬럼을 'YYYY-MM-DDTHH:mm:ss' 문자열로 주고받는다.
// pg 드라이버는 이 컬럼을 서버 로컬 시간 기준 Date로 파싱하므로 로컬 getter로 되돌리면
// 서버 TZ와 관계없이 DB에 저장된 값과 같은 문자열이 된다.
export const localDateTimeTransformer: ValueTransformer = {
  to: (value: string | null | undefined) => value,
  from: (value: Date | string | null): string | null => {
    if (value == null) return null;
    if (typeof value === 'string') return value;
    return (
      `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}` +
      `T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
    );
  },
};
