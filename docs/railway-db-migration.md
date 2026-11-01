# Supabase DB → Railway Postgres 이전 절차 (#119)

Supabase Postgres(싱가포르)를 Railway Postgres(싱가포르)로 옮기는 절차다. Storage는 이번 범위가 아니므로 Supabase Storage를 그대로 쓴다(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`는 유지).

모든 명령은 Windows PowerShell 기준이다. 비밀번호는 환경변수로만 다루고 명령줄이나 파일에 직접 쓰지 않는다. 각 단계의 `<...>` 값은 직접 채운다.

## 0. 사전 확인 (이전 전에 반드시)

1. **`return-requests` 모듈은 아직 Supabase PostgREST(`client.from(...)`)로 DB에 접근한다.** DB를 옮기면 이 모듈이 동작하지 않는다. 이전 전에 TypeORM으로 전환하거나, 전환 전까지 이전을 미룬다.
2. 이 브랜치 코드는 SSL을 `DB_SSL=true`일 때만 켠다. **Supabase에 연결된 현재 운영 서비스에 `DB_SSL=true`를 먼저 추가한 뒤 배포한다.** 빠뜨리면 배포 직후 Supabase 연결이 끊긴다.
3. 코드 배포(laundry, schedule, cleaning-duty의 TypeORM 전환)는 DB 이전과 분리해서 먼저 한다. 아직 Supabase DB를 보는 상태에서 세탁/일정/청소 API가 정상인지 확인한 뒤 이전을 시작한다.
4. 로컬에 Docker Desktop이 실행 중이어야 한다.

## 1. Railway에서 Postgres 서비스 생성

1. Railway 프로젝트에서 **New → Database → PostgreSQL**을 선택한다.
2. 서비스 Settings에서 리전이 싱가포르(`asia-southeast1`)인지 확인한다.
3. Variables 탭에서 다음 값을 확인해 둔다(화면 밖으로 복사하지 않는다).
   - 복원용(외부 접속): `DATABASE_PUBLIC_URL`의 호스트, 포트, 사용자, 비밀번호, DB 이름
   - 앱용(내부 접속): `RAILWAY_PRIVATE_DOMAIN`(예: `postgres.railway.internal`), 포트 `5432`

## 2. 서비스 중단 시간 정하기 / 쓰기 중단 안내

1. 사용량이 적은 시간대를 고르고, 앱 공지 등으로 작업 시간을 미리 알린다.
2. 덤프 시작 시점부터 7단계 완료까지 쓰기를 멈춘다. 쓰기가 계속되면 덤프 이후 데이터가 유실된다.
   - 가장 단순한 방법은 백엔드 서비스를 잠시 중지하는 것이다.
3. 예상 중단 시간은 덤프, 복원, 검증, 환경변수 교체와 재배포를 합친 시간이다. 먼저 사본 DB로 한 번 리허설해서 시간을 잰다.

## 3. Supabase에서 pg_dump (세션 풀러 5432)

Supabase의 **Connect → Session pooler** 문자열에서 호스트, 포트(5432), 사용자(`postgres.<project-ref>`)를 확인한다. 직접 연결(`db.<ref>.supabase.co`)은 IPv6 전용이라 안 될 수 있으므로 세션 풀러를 쓴다.

```powershell
# 덤프를 저장할 폴더 (저장소 밖에 둔다. 덤프에는 실제 사용자 데이터가 들어 있다)
$dumpDir = "$HOME\mirmi-dump"
New-Item -ItemType Directory -Force $dumpDir | Out-Null

# 접속 정보 (비밀번호는 입력 후 화면에 남기지 않는다)
$env:SRC_HOST = "<aws-0-ap-southeast-1.pooler.supabase.com>"
$env:SRC_PORT = "5432"
$env:SRC_USER = "postgres.<project-ref>"
$env:SRC_DB   = "postgres"
$env:PGPASSWORD = (Read-Host -AsSecureString "Supabase DB 비밀번호" | ConvertFrom-SecureString -AsPlainText)
```

> Windows PowerShell 5.1에서는 `ConvertFrom-SecureString -AsPlainText`를 쓸 수 없다. 5.1이면 `$env:PGPASSWORD = "<비밀번호>"`로 직접 넣고, 작업 후 `Remove-Item Env:PGPASSWORD`로 지운다.

```powershell
# plain SQL 덤프. -f로 컨테이너 안에서 직접 파일을 쓴다(PowerShell의 > 리다이렉트는 UTF-16으로 저장되어 복원이 깨진다)
docker run --rm -e PGPASSWORD -v "${dumpDir}:/dump" postgres:17 `
  pg_dump -h $env:SRC_HOST -p $env:SRC_PORT -U $env:SRC_USER -d $env:SRC_DB `
  --schema=public --no-owner --no-privileges -f /dump/mirmi.sql
```

덤프에 Supabase 전용 객체가 섞였는지 확인한다.

```powershell
Select-String -Path "$dumpDir\mirmi.sql" -Pattern "POLICY|ROW LEVEL SECURITY|auth\.|CREATE EXTENSION|TO (anon|authenticated|service_role)"
```

- 결과가 있으면 Railway에는 `anon`, `authenticated`, `auth` 스키마가 없어 복원이 실패한다. 앱은 DB에 직접 접속하므로 RLS 정책은 필요 없다. 해당 줄(`CREATE POLICY ...`, `ENABLE ROW LEVEL SECURITY`)을 덤프 파일에서 제거하고 진행한다.
- 결과가 없으면 그대로 진행한다.

## 4. Railway Postgres에 복원

```powershell
$env:DST_HOST = "<DATABASE_PUBLIC_URL의 호스트>"
$env:DST_PORT = "<DATABASE_PUBLIC_URL의 포트>"
$env:DST_USER = "postgres"
$env:DST_DB   = "railway"
$env:PGPASSWORD = (Read-Host -AsSecureString "Railway DB 비밀번호" | ConvertFrom-SecureString -AsPlainText)

# 빈 DB에만 복원한다. 이미 테이블이 있는 DB에는 실행하지 않는다
docker run --rm -e PGPASSWORD -v "${dumpDir}:/dump" postgres:17 `
  psql -h $env:DST_HOST -p $env:DST_PORT -U $env:DST_USER -d $env:DST_DB `
  -v ON_ERROR_STOP=1 -f /dump/mirmi.sql
```

`ON_ERROR_STOP=1`이라 오류가 나면 즉시 멈춘다. 멈췄다면 원인을 고치고, Railway DB를 새로 만들거나 비운 뒤 처음부터 다시 복원한다. **원본(Supabase)에는 어떤 쓰기도 하지 않는다.**

## 5. 시퀀스와 행 수 비교

원본과 대상에서 같은 쿼리를 실행해 결과를 비교한다. 쿼리를 파일로 만든다.

```powershell
@'
SELECT table_name,
       (xpath('/row/c/text()',
              query_to_xml(format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text::int AS row_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
'@ | Set-Content -Encoding utf8 "$dumpDir\counts.sql"

@'
SELECT sequencename, last_value
FROM pg_sequences
WHERE schemaname = 'public'
ORDER BY sequencename;
'@ | Set-Content -Encoding utf8 "$dumpDir\seq.sql"
```

원본(Supabase) 결과를 저장한다.

```powershell
$env:PGPASSWORD = (Read-Host -AsSecureString "Supabase DB 비밀번호" | ConvertFrom-SecureString -AsPlainText)
foreach ($q in "counts", "seq") {
  docker run --rm -e PGPASSWORD -v "${dumpDir}:/dump" postgres:17 `
    psql -h $env:SRC_HOST -p $env:SRC_PORT -U $env:SRC_USER -d $env:SRC_DB -At -F "|" -f /dump/$q.sql `
    | Set-Content -Encoding utf8 "$dumpDir\src_$q.txt"
}
```

대상(Railway) 결과를 저장한다.

```powershell
$env:PGPASSWORD = (Read-Host -AsSecureString "Railway DB 비밀번호" | ConvertFrom-SecureString -AsPlainText)
foreach ($q in "counts", "seq") {
  docker run --rm -e PGPASSWORD -v "${dumpDir}:/dump" postgres:17 `
    psql -h $env:DST_HOST -p $env:DST_PORT -U $env:DST_USER -d $env:DST_DB -At -F "|" -f /dump/$q.sql `
    | Set-Content -Encoding utf8 "$dumpDir\dst_$q.txt"
}
```

비교한다. 출력이 없으면 일치한다.

```powershell
foreach ($q in "counts", "seq") {
  Compare-Object (Get-Content "$dumpDir\src_$q.txt") (Get-Content "$dumpDir\dst_$q.txt")
}
```

- `counts`가 다르면 복원이 불완전한 것이다. 6단계로 넘어가지 않는다.
- `seq`가 다르면 대상에서 `SELECT setval('<시퀀스명>', <원본 last_value>);`로 맞춘다. 시퀀스가 어긋나면 이후 INSERT가 PK 중복 오류를 낸다.
- 주의: 비어 있는 테이블의 시퀀스는 `last_value`가 `NULL`로 나오는데 정상이다.

## 6. 서비스 DB_* 환경변수 교체 후 배포

롤백을 위해 **교체 전에 현재 `DB_*` 값을 안전한 곳에 따로 보관한다**(비밀번호 관리자 등).

백엔드 서비스의 환경변수를 다음과 같이 바꾼다.

| 변수 | 새 값 |
| --- | --- |
| `DB_HOST` | Railway 내부 주소 (예: `postgres.railway.internal`) |
| `DB_PORT` | `5432` |
| `DB_USER` | Railway Postgres 사용자 |
| `DB_PASSWORD` | Railway Postgres 비밀번호 |
| `DB_NAME` | Railway Postgres DB 이름 |
| `DB_SSL` | 삭제하거나 `false` (내부 주소는 SSL이 필요 없다) |
| `DB_POOL_MAX` | (선택) 기본 10 |

저장 후 재배포한다. 배포가 끝나면 다음을 확인한다.

1. 로그인이 된다.
2. 세탁 시간표, 일정, 청소 당번 조회가 된다.
3. 쓰기 하나(예: 건의사항 등록 후 삭제)가 된다.
4. 로그에 DB 연결 오류가 없다.

이상이 없으면 2단계에서 멈춘 쓰기를 재개하고 공지를 해제한다.

## 7. 문제 시 롤백

1. 백엔드 서비스의 `DB_*` 환경변수를 6단계 전에 보관한 Supabase 값으로 되돌린다.
2. **`DB_SSL=true`를 다시 설정한다.** Supabase는 SSL이 필요하다.
3. 재배포한다.
4. 이전 이후 Railway DB에만 쌓인 쓰기가 있다면 Supabase에는 없다. 롤백 전에 필요한 데이터를 따로 백업한다.

**Supabase DB는 이전 검증이 끝나고 충분한 기간(예: 1~2주)이 지날 때까지 삭제하거나 일시정지하지 않는다.**
