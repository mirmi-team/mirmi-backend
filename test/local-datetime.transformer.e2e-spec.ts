import { localDateTimeTransformer } from '../src/common/transformers/local-datetime.transformer';

const from = (v: Date | string | null) =>
  localDateTimeTransformer.from(v) as string | null;
const to = (v: unknown) => localDateTimeTransformer.to(v) as unknown;

describe('localDateTimeTransformer', () => {
  describe('from', () => {
    it('null은 null', () => {
      expect(from(null)).toBeNull();
    });

    it('Date는 로컬 벽시계 값에 +09:00을 붙여 반환한다', () => {
      // 서버 TZ와 무관하게 로컬 getter 기준이므로 로컬 생성자로 만든다
      expect(from(new Date(2026, 4, 14, 9, 30, 5))).toBe(
        '2026-05-14T09:30:05+09:00',
      );
    });

    it('소수부는 끝의 0을 생략한다', () => {
      expect(from(new Date(2026, 4, 14, 9, 30, 5, 120))).toBe(
        '2026-05-14T09:30:05.12+09:00',
      );
      expect(from(new Date(2026, 4, 14, 9, 30, 5, 7))).toBe(
        '2026-05-14T09:30:05.007+09:00',
      );
    });

    it('오프셋 없는 문자열에는 +09:00을 붙인다', () => {
      expect(from('2026-05-14T09:30:05')).toBe('2026-05-14T09:30:05+09:00');
      expect(from('2026-05-14 09:30:05.5')).toBe('2026-05-14T09:30:05.5+09:00');
    });

    it('타임존이 이미 있는 문자열은 중복해서 붙이지 않는다', () => {
      expect(from('2026-05-14T09:30:05+09:00')).toBe(
        '2026-05-14T09:30:05+09:00',
      );
      expect(from('2026-05-14T00:30:05Z')).toBe('2026-05-14T00:30:05Z');
      expect(from('2026-05-14T09:30:05.123+0900')).toBe(
        '2026-05-14T09:30:05.123+0900',
      );
    });
  });

  describe('to', () => {
    it('오프셋 없는 문자열과 null/undefined는 그대로', () => {
      expect(to('2026-05-14T09:30:05')).toBe('2026-05-14T09:30:05');
      expect(to(null)).toBeNull();
      expect(to(undefined)).toBeUndefined();
    });

    it('+09:00이 붙어 오면 KST 벽시계 값으로 들어간다', () => {
      expect(to('2026-05-14T09:30:05+09:00')).toBe('2026-05-14T09:30:05');
      expect(to('2026-05-14T09:30:05.120+09:00')).toBe(
        '2026-05-14T09:30:05.12',
      );
    });

    it('Z(UTC)가 붙어 오면 KST로 환산한다 (timestamp 컬럼은 오프셋을 무시하므로)', () => {
      expect(to('2026-05-14T00:30:05Z')).toBe('2026-05-14T09:30:05');
      expect(to('2026-05-14T20:00:00.000Z')).toBe('2026-05-15T05:00:00');
    });

    it('다른 오프셋도 KST로 환산한다', () => {
      expect(to('2026-05-14T09:30:05+0000')).toBe('2026-05-14T18:30:05');
      expect(to('2026-05-14T09:30:05-05:00')).toBe('2026-05-14T23:30:05');
    });

    it('Date는 서버 TZ와 무관하게 KST 벽시계 값이 된다', () => {
      expect(to(new Date('2026-05-14T00:30:05Z'))).toBe('2026-05-14T09:30:05');
    });

    it('to → from 왕복에서 +09:00 문자열이 유지된다', () => {
      const stored = to('2026-05-14T09:30:05+09:00') as string;
      expect(from(stored)).toBe('2026-05-14T09:30:05+09:00');
    });
  });
});
