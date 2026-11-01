-- E2E 테스트 전용 DB 스키마. 엔티티(src/**/entities)를 기준으로 작성했다.
-- 운영 DB에는 적용하지 않는다.

CREATE TYPE users_role_enum AS ENUM ('STUDENT', 'ADMIN');
CREATE TYPE users_gender_enum AS ENUM ('MALE', 'FEMALE');
CREATE TYPE merit_logs_type_enum AS ENUM ('PENALTY', 'REWARD');
CREATE TYPE merit_reasons_type_enum AS ENUM ('PENALTY', 'REWARD');
CREATE TYPE suggestion_category AS ENUM (
  'FACILITY', 'OPERATION', 'MEAL', 'CLEANING', 'SAFETY', 'NOISE', 'ETC'
);

CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  room_number INTEGER NOT NULL UNIQUE,
  floor INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL,
  room_id INTEGER NOT NULL REFERENCES rooms (id),
  role users_role_enum NOT NULL DEFAULT 'STUDENT',
  can_staying BOOLEAN NOT NULL DEFAULT false,
  total_merit_score INTEGER NOT NULL DEFAULT 0,
  password VARCHAR NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  grade INTEGER NOT NULL,
  class_no INTEGER NOT NULL,
  profile_image VARCHAR,
  gender users_gender_enum
);

CREATE TABLE email_verifications (
  id SERIAL PRIMARY KEY,
  email VARCHAR NOT NULL,
  verification_code VARCHAR NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token_hash VARCHAR(60) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_info VARCHAR
);

CREATE TABLE merit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type merit_logs_type_enum NOT NULL,
  score INTEGER NOT NULL,
  reason VARCHAR NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
  youtube_url VARCHAR NOT NULL,
  thumbnail VARCHAR,
  play_date DATE NOT NULL,
  play_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stay_status (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  status VARCHAR(10) NOT NULL,
  week_start DATE NOT NULL,
  parent_phone VARCHAR(20) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE suggestion (
  id SERIAL PRIMARY KEY,
  created_by INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category suggestion_category NOT NULL,
  reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notices (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  image_url VARCHAR
);

CREATE TABLE laundry (
  id SERIAL PRIMARY KEY,
  status VARCHAR NOT NULL,
  floor INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE laundry_request (
  id SERIAL PRIMARY KEY,
  laundry_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  room_number INTEGER NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR NOT NULL
);

CREATE TABLE laundry_fixed_schedule (
  id SERIAL PRIMARY KEY,
  floor INTEGER NOT NULL,
  day_of_week VARCHAR NOT NULL,
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
  status VARCHAR NOT NULL
);

CREATE TABLE dormitory_schedule (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  schedule_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
