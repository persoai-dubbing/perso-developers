# Perso AI 개발 가이드

이 문서는 Perso AI API를 처음 연동하는 개발자를 위한 실전 가이드입니다. 계정이 이미 있다는 전제에서, **키 발급 → 첫 호출 → 코드 연동 → 모니터링**까지 한 흐름으로 진행할 수 있도록 구성했습니다.

- **API Base URL**: `https://api.perso.ai`
- **인증 방식**: `XP-API-KEY` 헤더 (JWT Bearer 토큰 사용 안 함)
- **응답 포맷**: JSON (`Content-Type: application/json`)
- **개발자 포털**: `https://developers.perso.ai`

전체 흐름을 먼저 한눈에 잡고 각 단계로 내려가세요.

```
[1] API Key 발급 → [2] Try it로 첫 호출 → [3] 코드에 이식 → [4] Usage로 모니터링
```

---

## 1. API Key 발급

모든 API 호출에는 활성 상태의 API Key가 필요합니다.

### 1.1 발급 절차

1. 포털의 **API Keys** 메뉴 → **Generate New Key** 클릭
2. 입력 항목
   - **Key Name** (선택, 최대 16자): 식별용 라벨. 예: `Main API`, `Batch Job`, `Internal Tool`
   - **Expiration Period**: `30 days` / `90 days` / `1 year` / `2 years` 중 선택 (기본 30일)
3. 생성 직후 **전체 키가 단 한 번만** 표시됩니다. 즉시 복사해 Secret Manager 또는 `.env`에 저장하세요.
4. 이후부터는 마스킹 처리(`pk_live_xxxxxxxx***abcd`)되어 전체 값을 다시 볼 수 없습니다. 분실 시 **Revoke → 재발급** 외에 복구 수단이 없습니다.

### 1.2 키 생명주기

| 상태 | 의미 | 복구 |
|---|---|---|
| `Active` | 호출 가능 | — |
| `Expired` | 만료일 경과. 자동 무효 | 새 키 발급 |
| `Revoked` | 수동 무효화 | 새 키 발급 |

- **Revoke**: 키만 비활성화, 목록·로그 이력은 유지. 유출 의심 시 가장 먼저 수행.
- **Delete**: 목록에서도 제거. 되돌릴 수 없습니다.

### 1.3 시크릿 취급 규칙

- 클라이언트 번들(브라우저·모바일 앱)에 키를 포함하지 않습니다. **서버 사이드 전용**.
- 저장소: 환경 변수 또는 Secret Manager(AWS Secrets Manager, GCP Secret Manager, Vault 등).
- 용도별로 키를 분리 발급해 사고 영향 범위를 제한합니다.
- 주기적 로테이션, 미사용 키는 Revoke.

---

## 2. Try it로 첫 호출 확인하기

별도 도구 없이 포털 내부에서 엔드포인트를 바로 호출할 수 있습니다. 스펙을 읽으면서 실제 응답 구조를 즉시 확인할 수 있어 연동 초기에 유용합니다.

### 2.1 진입

**API Reference → Perso API** 아래 원하는 서비스(예: `Space`, `Media`, `Dubbing`, `STT`) 페이지에서, 각 엔드포인트 카드의 **Try it** 버튼을 클릭합니다.

### 2.2 다이얼로그 구성

좌우 2단 레이아웃입니다.

- **좌측 — 요청 파라미터**
  - `XP-API-KEY` (필수): 발급받은 키. 비우면 cURL 미리보기에 `<your-api-key>`가 들어가고, 실제 전송 시 인증 오류가 납니다.
  - **Path Parameters**: 경로 치환 값. 필수 항목은 이름 옆 빨간 `*`.
  - **Query Parameters**: 기본값이 있는 경우 placeholder에 `Default: ...` 표시. 비우면 URL에서 제외됩니다.
  - **Body Parameters**: 엔드포인트 예시 JSON이 기본 입력됨. 자유 수정 가능. `GET`/`HEAD`/`DELETE`에서는 전송되지 않습니다.
- **우측 — cURL 미리보기 & 응답**
  - **Request**: 입력값으로 자동 생성되는 cURL 스니펫. 복사 버튼으로 바로 터미널·문서에 붙여넣기 가능.
  - **Response**: `Send request` 클릭 직후의 실제 응답. 상태 코드 배지(2XX=초록, 그 외=빨강)와 함께 JSON은 pretty-print 처리.

### 2.3 동작 특성 (반드시 인지)

- Try it의 요청은 포털 서버의 `/proxy/*` 경로를 거쳐 백엔드에 전달되므로, 브라우저 CORS 제약이 없습니다.
- **실제 API 호출과 동일합니다.** 과금·쿼터가 소모되고, **Usage → Request Logs에도 동일하게 기록**됩니다.
- 파괴적 작업(`DELETE`, 대용량 업로드)을 테스트할 때는 대상 리소스를 신중히 고르세요.
- 입력한 API 키는 다이얼로그 상태에만 존재하며, 닫으면 초기화됩니다(localStorage 저장 없음).

### 2.4 권장 패턴

1. API Reference에서 스펙·필드 의미 파악
2. Try it으로 샘플 값 넣어 호출 → 응답 구조 확인
3. 우측 cURL 복사 → 코드로 이식
4. Usage → Request Logs에서 동일 요청이 정상 집계되는지 확인

---

## 3. 코드로 연동하기

Try it에서 검증한 호출을 그대로 서버 코드에 옮기는 단계입니다. 모든 언어에서 공통되는 규칙은 다음과 같습니다.

- Base URL: `https://api.perso.ai`
- 인증: `XP-API-KEY: {YOUR_KEY}` 헤더
- JSON 요청 시: `Content-Type: application/json`
- 응답의 `perso-storage://` 경로는 `https://portal-media.perso.ai` 기준으로 해석(필요 시 리졸버 구현)

### 3.1 cURL

```bash
curl -X GET "https://api.perso.ai/portal/api/v1/spaces" \
     -H "XP-API-KEY: $PERSO_API_KEY"
```

```bash
curl -X POST "https://api.perso.ai/video-translator/api/v1/" \
     -H "XP-API-KEY: $PERSO_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"spaceSeq": 123, "sourceLanguage": "en", "targetLanguage": "ko"}'
```

### 3.2 Node.js (fetch)

```ts
const BASE_URL = "https://api.perso.ai";
const API_KEY = process.env.PERSO_API_KEY!;

async function persoFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "XP-API-KEY": API_KEY,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[${res.status}] ${body}`);
  }
  return res.json() as Promise<T>;
}

// 사용 예
const spaces = await persoFetch<{ result: unknown[] }>("/portal/api/v1/spaces");
```

### 3.3 Python (requests)

```python
import os
import requests

BASE_URL = "https://api.perso.ai"
API_KEY = os.environ["PERSO_API_KEY"]

session = requests.Session()
session.headers.update({
    "XP-API-KEY": API_KEY,
    "Content-Type": "application/json",
})

def perso_get(path: str, **kwargs):
    r = session.get(f"{BASE_URL}{path}", **kwargs)
    r.raise_for_status()
    return r.json()

# 사용 예
spaces = perso_get("/portal/api/v1/spaces")
```

### 3.4 멀티 테넌시 (`spaceSeq`)

Perso 플랫폼의 도메인 데이터는 대부분 **Space 단위**로 스코프됩니다. 거의 모든 도메인 API가 요청 본문·쿼리의 `spaceSeq`를 요구합니다. "빈 결과가 내려온다"의 가장 흔한 원인은 `spaceSeq` 누락·오입력입니다.

- 연동 시작 시점에 "이 호출은 어느 Space 데이터인지"를 명확히 정하고 상수·설정으로 관리하세요.
- 서버 간 호출일 때도 `spaceSeq`는 **요청 측 책임**입니다.

### 3.5 비동기 작업 (Dubbing, STT, TTS 등)

긴 작업은 즉시 완료되지 않고 **job/project ID를 리턴**합니다. 클라이언트가 직접 폴링하거나, 완료 웹훅을 받아 처리해야 합니다.

일반적인 패턴:

1. `POST /.../projects` → `projectId` 수신 (상태 `PENDING`)
2. `GET /.../projects/{projectId}` 폴링 (interval 2~5초, exponential backoff 권장)
3. 상태가 `COMPLETED`가 되면 결과 리소스 GET
4. 실패(`FAILED`) 시 에러 본문의 code·message 확인

폴링은 요청 핸들러 안에서 blocking으로 돌리지 말고 백그라운드 워커·큐(Celery, BullMQ, SQS 등)로 위임하세요.

### 3.6 에러 처리 규칙

| 상태 | 의미 | 대응 |
|---|---|---|
| `400` | 요청 스펙 오류 | 본문 검증, 필드명·타입 확인 |
| `401` | 인증 실패 | `XP-API-KEY` 헤더 이름·값·상태 확인 |
| `403` | 권한 없음 | 해당 Space에 대한 권한, 키 스코프 확인 |
| `404` | 리소스 없음 | `spaceSeq`, ID 재확인 |
| `409` | 상태 충돌 | 이미 진행 중인 작업 여부 |
| `429` | 레이트 리밋 | 백오프 후 재시도, 쿼터 설정 검토 |
| `5xx` | 서버 오류 | 재시도(지수 백오프), 지속 발생 시 Request ID와 함께 문의 |

응답 JSON의 `errorCode` / `message`가 1차 디버깅 소스입니다. Usage 로그에서 **Request ID**를 확보해 문의하세요.

---

## 4. Usage로 모니터링하기

연동이 시작되면 Usage 화면이 프로덕션 운영의 기본 관측 포인트가 됩니다.

### 4.1 Home (Overview)

- **Top Endpoints**: 최근 호출 상위 엔드포인트
- **Recent Errors**: 최근 4XX/5XX 응답 — **장애 감지의 첫 신호**
- **API Key Summary**: 활성 키 현황
- **Time Range** (`Today` ~ `30 days`), **Timezone** (`UTC`/`KST`) 토글

### 4.2 Usage 페이지

#### 공통 필터 (상단 바)

- **Timezone**: `UTC`/`KST` (Home과 동기화)
- **Time Range**: `1h` / `6h` / `24h` / `7d` / `30d`
- **API Key**: `All` 또는 특정 키 선택
- **Refresh**: 통계·차트·로그를 동시 갱신

#### Stats Cards

| 카드 | 지표 |
|---|---|
| Total Requests | 전체 요청 수 + 이전 구간 대비 증감율 |
| Success Rate | 2XX 비율 |
| Avg. Latency | 평균 응답 시간 (ms) |
| Error Rate | 4XX+5XX 비율 |

#### Usage Charts

- **Requests Over Time** — 시계열 요청 수 (2XX/4XX/5XX 범례)
- **Response Status Distribution** — 상태 코드 분포
- **Response Latency** — 시계열 지연 (p50/p95 등)

#### Request Logs (핵심)

개별 호출의 원문을 확인하는 도구.

- 컬럼: Timestamp / Method / Endpoint / Status / Latency / API Key
- 필터: Method(복수 선택), Search(엔드포인트 부분 일치), Status(`2XX`/`4XX`/`5XX` 다중 선택)
- 페이지당 20건
- **행 클릭 → 상세 다이얼로그**
  - Metadata: Timestamp, Latency, API Key, Client IP, **Request ID**
  - **Request Payload**: 요청 본문 원문(JSON pretty-print)
  - **Error Information** (4XX/5XX일 때만): Error Code, Error Message

> 응답 본문 전체는 저장되지 않습니다(개인정보·용량). 응답 검증이 필요하면 **서버측 로깅을 병행**하거나, Request ID로 지원팀에 문의하세요.

### 4.3 장애 대응 플로우

1. Home의 **Recent Errors**에서 이상 응답 감지
2. Usage → Time Range를 해당 시점 포함 구간으로 조정
3. Status 필터 `4XX` 또는 `5XX`로 좁히기
4. 문제 행 클릭 → Request Payload · Error Code/Message 확인
5. **Request ID** 복사 → 이슈 트래커·문의 채널에 첨부

---

## 5. 자주 겪는 이슈

- **401 Unauthorized** — `XP-API-KEY` 헤더 이름 오타, 키 상태(`Expired`/`Revoked`), 환경변수 미로딩, 잘못된 배포 환경의 키 사용.
- **404 Not Found + 빈 결과** — `spaceSeq` 누락·오입력을 먼저 의심.
- **요청이 로그에 안 보임** — API Key 필터가 특정 키로 고정, Time Range 부족, 집계 지연(1~2초) 확인.
- **시각이 예상과 다름** — 상단 Timezone 토글(`UTC`/`KST`) 확인. 한쪽에서 바꾸면 다른 화면에도 반영됩니다.
- **키 문자열 재확인 불가** — 설계상 생성 시 1회만 공개. 분실 시 Revoke 후 재발급.
- **`perso-storage://` 경로가 안 열림** — `https://portal-media.perso.ai` 기준으로 해석해야 합니다. Base URL(`https://api.perso.ai`)과 다릅니다.
- **파일 업로드 — 단일 API 호출이 아님**: Dubbing·STT·Lip Sync 등에 쓸 파일은 `POST /dubbing`에 직접 첨부하는 게 아니라, **별도의 3단계 업로드 플로우**로 먼저 `mediaSeq`를 만들고 그 값을 전달해야 합니다. 가장 자주 놓치는 포인트입니다.

  **(A) 직접 업로드 (로컬 파일 → Azure Blob)**

  ```
  1) GET  /file/api/upload/sas-token?fileName={URL-encoded fileName}
         → { blobSasUrl, ... }   (유효시간 30분)

  2) PUT  {blobSasUrl}                         ← Azure로 직접, Perso API 아님
         Header: x-ms-blob-type: BlockBlob
         Body: 파일 바이너리
         ※ XP-API-KEY / Authorization 헤더 넣지 말 것
         → 201 Created (empty body)
         → 403 이면 SAS 만료, 1) 다시 호출

  3) POST /file/api/upload/video   (또는 /audio)
         Body: { "fileUrl": "<blobSasUrl에서 '?' 이전까지>" , ... }
         → { "seq": 12345, ... }   ← 이 seq가 다른 API의 mediaSeq
  ```

  - (선택) 업로드 전에 `POST /file/api/v1/media/validate`로 용량·해상도·길이·확장자 사전 검증 → 긴 업로드 후 실패하는 사태 방지.
  - `fileName`은 반드시 URL 인코딩. Step 2의 `fileUrl`에는 쿼리스트링 `?sig=...`를 **제외**한 블랍 URL만 넣습니다.

  **(B) 외부 플랫폼 (YouTube / TikTok / Google Drive)**

  ```
  1) POST /file/api/v1/video-translator/external/metadata
         → duration, resolution, size 프리뷰
  2) POST /file/api/v1/media/validate             (권장)
  3) POST /file/api/upload/video/external
         → { "seq": 12345, ... }   ← 이 seq를 mediaSeq로 사용
         ※ 동기 API. 서버가 다운로드 끝날 때까지 응답 지연 최대 10분
  ```

  **전형적 실패 사례**
  - `POST /video-translator`에 파일을 직접 붙이거나, Step 3을 건너뛴 채 블랍 URL만 전달 → `400 / 404`.
  - Step 2에 `XP-API-KEY`를 넣음 → Azure가 요청 거부.
  - Step 2 이후 30분 지연 → SAS 만료 → Step 3에서 업로드된 파일을 찾지 못함.
  - Step 3의 `fileUrl`에 `?sig=…` 쿼리스트링까지 포함 → 등록 실패.

  상세 필드·응답 스키마는 사이드바 **API Reference → Media** 참고.
