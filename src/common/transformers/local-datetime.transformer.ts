import { ValueTransformer } from 'typeorm';

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

const KST_OFFSET = '+09:00';
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 'YYYY-MM-DDTHH:mm[:ss[.fff]]' 뒤에 붙은 타임존 표기 (Z, +09:00, +0900, +09)
// 날짜만 있는 'YYYY-MM-DD'의 '-DD'를 오프셋으로 오인하지 않도록 시각 부분을 앞에 요구한다.
const OFFSET_PATTERN =
  /^(.*\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)\s*(Z|[+-]\d{2}(?::?\d{2})?)$/i;

// 소수부 끝의 0은 생략한다 (PostgREST가 내려주던 형식)
const formatFraction = (ms: number) => {
  const fraction = pad(ms, 3).replace(/0+$/, '');
  return fraction ? `.${fraction}` : '';
};

const formatWallClock = (
  year: number,
  month: number, // 1~12
  day: number,
  hours: number,
  minutes: number,
  seconds: number,
  ms: number,
) =>
  `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}` +
  formatFraction(ms);

// "+09:00", "-0330", "Z" → 분 단위 오프셋
const parseOffsetMinutes = (offset: string): number => {
  if (offset.toUpperCase() === 'Z') return 0;
  const sign = offset[0] === '-' ? -1 : 1;
  const digits = offset.slice(1).replace(':', '');
  const hours = Number(digits.slice(0, 2));
  const minutes = digits.length > 2 ? Number(digits.slice(2, 4)) : 0;
  return sign * (hours * 60 + minutes);
};

// Date(순간)를 서버 TZ와 관계없이 KST 벽시계 문자열 'YYYY-MM-DDTHH:mm:ss[.fff]'로 만든다.
export function toKstWallClock(date: Date): string {
  const k = new Date(date.getTime() + KST_OFFSET_MS);
  return formatWallClock(
    k.getUTCFullYear(),
    k.getUTCMonth() + 1,
    k.getUTCDate(),
    k.getUTCHours(),
    k.getUTCMinutes(),
    k.getUTCSeconds(),
    k.getUTCMilliseconds(),
  );
}

// 지금 시각을 API 응답과 같은 형식('...+09:00')으로 만든다. 저장 시 to()가 오프셋을 떼어
// KST 벽시계 값으로 넣어주므로 그대로 엔티티에 대입해도 된다.
export function nowKstDateTime(): string {
  return `${toKstWallClock(new Date())}${KST_OFFSET}`;
}

// timestamp(without time zone) 컬럼을 'YYYY-MM-DDTHH:mm:ss[.fff]+09:00' 문자열로 주고받는다.
// DB에는 KST 벽시계 값이 오프셋 없이 저장돼 있고, 응답에는 KST임을 알 수 있도록 +09:00을 붙인다.
//
// from: pg 드라이버는 이 컬럼을 서버 로컬 시간 기준 Date로 파싱하므로 로컬 getter로 되돌리면
//       DB에 저장된 벽시계 값과 같은 문자열이 된다. (서버 TZ=Asia/Seoul 전제)
//       이미 타임존이 붙은 문자열은 중복해서 붙이지 않는다.
// to:   PostgreSQL의 timestamp 컬럼은 입력 문자열의 오프셋을 조용히 무시한다.
//       ('...Z'를 그대로 넣으면 UTC 벽시계 값이 저장돼 9시간 어긋난다)
//       그래서 오프셋이 붙어 온 값은 순간으로 해석한 뒤 KST 벽시계 값으로 바꿔서 넣는다.
export const localDateTimeTransformer: ValueTransformer = {
  to: (value: unknown) => {
    if (value instanceof Date) return toKstWallClock(value);
    if (typeof value !== 'string') return value;

    const match = OFFSET_PATTERN.exec(value);
    if (!match) return value;

    const wallClock = match[1].replace(' ', 'T');
    const asUtc = Date.parse(`${wallClock}Z`);
    if (Number.isNaN(asUtc)) return value;

    const instant = new Date(asUtc - parseOffsetMinutes(match[2]) * 60 * 1000);
    return toKstWallClock(instant);
  },
  from: (value: Date | string | null): string | null => {
    if (value == null) return null;
    if (typeof value === 'string') {
      if (OFFSET_PATTERN.test(value)) return value;
      return `${value.replace(' ', 'T')}${KST_OFFSET}`;
    }
    return (
      formatWallClock(
        value.getFullYear(),
        value.getMonth() + 1,
        value.getDate(),
        value.getHours(),
        value.getMinutes(),
        value.getSeconds(),
        value.getMilliseconds(),
      ) + KST_OFFSET
    );
  },
};
