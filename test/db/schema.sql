-- E2E 테스트 전용 DB 스키마. 운영 DB의 실제 컬럼 타입(information_schema 조회 결과)을 기준으로 작성했다.
-- 운영 DB에는 적용하지 않는다.
-- 시간 컬럼은 운영과 같이 대부분 timestamp without time zone이다.

-- enum 이름은 운영 조회 결과에 나온 것(user_role, cleaning_status, laundry_status)만 확정이다.
-- merit/suggestion enum 이름은 엔티티 기준, return_type/reservation_status 이름은 추정이다.
CREATE TYPE user_role AS ENUM ('STUDENT', 'ADMIN');
CREATE TYPE users_gender_enum AS ENUM ('MALE', 'FEMALE');
CREATE TYPE merit_logs_type_enum AS ENUM ('PENALTY', 'REWARD');
CREATE TYPE merit_reasons_type_enum AS ENUM ('PENALTY', 'REWARD');
CREATE TYPE suggestion_category AS ENUM (
  'FACILITY', 'OPERATION', 'MEAL', 'CLEANING', 'SAFETY', 'NOISE', 'ETC'
);
CREATE TYPE cleaning_status AS ENUM ('PENDING', 'DONE');
CREATE TYPE laundry_status AS ENUM ('AVAILABLE', 'BROKEN');
CREATE TYPE reservation_status AS ENUM ('PENDING', 'IN_USE', 'DONE', 'CANCELED');
CREATE TYPE return_type AS ENUM ('IMMEDIATE', 'DINNER', 'EIGHT_PM');

CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  room_number INTEGER NOT NULL UNIQUE,
  floor INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR NOT NULL UNIQUE,
  username VARCHAR NOT NULL,
  room_id INTEGER NOT NULL REFERENCES rooms (id),
  grade INTEGER,
  class_no INTEGER,
  role user_role NOT NULL DEFAULT 'STUDENT',
  can_staying BOOLEAN NOT NULL DEFAULT false,
  total_merit_score INTEGER NOT NULL DEFAULT 0,
  -- 아래 컬럼들은 운영 조회 결과가 잘려 확인하지 못했다. 엔티티 기준.
  password VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  profile_image VARCHAR,
  gender users_gender_enum
);

CREATE TABLE email_verifications (
  id SERIAL PRIMARY KEY,
  email VARCHAR NOT NULL,
  verification_code VARCHAR NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token_hash VARCHAR NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  device_info VARCHAR
);

CREATE TABLE merit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type merit_logs_type_enum NOT NULL,
  score INTEGER NOT NULL,
  reason VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE merit_reasons (
  id SERIAL PRIMARY KEY,
  type merit_reasons_type_enum NOT NULL,
  reason VARCHAR NOT NULL,
  default_score INTEGER NOT NULL
);

CREATE TABLE morning_songs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  song_name VARCHAR NOT NULL,
  play_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  youtube_url VARCHAR NOT NULL,
  thumbnail VARCHAR,
  play_order INTEGER
);

CREATE TABLE stay_status (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  week_start DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR NOT NULL DEFAULT 'STAY',
  parent_phone VARCHAR NOT NULL
);

CREATE TABLE suggestion (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  category suggestion_category NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  reply TEXT
);

CREATE TABLE notices (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  image_url VARCHAR
);

CREATE TABLE laundry (
  id SERIAL PRIMARY KEY,
  status laundry_status NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  floor INTEGER
);

CREATE TABLE laundry_request (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  room_number INTEGER NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status reservation_status NOT NULL,
  laundry_id INTEGER NOT NULL
);

CREATE TABLE laundry_fixed_schedule (
  id SERIAL PRIMARY KEY,
  floor INTEGER NOT NULL,
  day_of_week TEXT NOT NULL,
  machine_no INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  assigned_room INTEGER,
  assigned_room_2 INTEGER
);

CREATE TABLE cleaning_duty (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL,
  duty_date TIMESTAMP NOT NULL,
  status cleaning_status NOT NULL DEFAULT 'PENDING'
);

CREATE TABLE dormitory_schedule (
  id SERIAL PRIMARY KEY,
  title VARCHAR,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  schedule_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE return_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  return_type return_type,
  reason VARCHAR,
  actual_return_time TIMESTAMP,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE
);
