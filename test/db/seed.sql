-- E2E 테스트 계정 시드 (test/utils/e2e-setup.ts의 STUDENT_ACCOUNT, ADMIN_ACCOUNT와 일치해야 한다)
-- 두 계정의 비밀번호는 e2e-setup.ts의 password(bcrypt 해시)다. 테스트 전용 DB에서만 사용한다.

INSERT INTO rooms (room_number, floor) VALUES (201, 2), (301, 3);

INSERT INTO users (
  email, username, room_id, role, password, grade, class_no, gender
) VALUES
  (
    's2546@e-mirim.hs.kr', '테스트학생',
    (SELECT id FROM rooms WHERE room_number = 201), 'STUDENT',
    '$2b$10$WHP9ekVdQ8dPGUVd4ezqruwZB2yyQQB6l44LAcuLfPj5Dcc9oXx1K', 2, 5, 'MALE'
  ),
  (
    's2531@e-mirim.hs.kr', '테스트관리자',
    (SELECT id FROM rooms WHERE room_number = 301), 'ADMIN',
    '$2b$10$WHP9ekVdQ8dPGUVd4ezqruwZB2yyQQB6l44LAcuLfPj5Dcc9oXx1K', 2, 1, 'FEMALE'
  );

-- 가입된 학생 계정은 이메일 인증을 마친 상태다 (중복 가입 시 409 검증에 필요)
INSERT INTO email_verifications (
  email, verification_code, is_verified, verified_at, expires_at
) VALUES (
  's2546@e-mirim.hs.kr', '000000', true, now(), now() + interval '100 years'
);
