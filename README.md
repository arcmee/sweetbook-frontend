# sweetbook-frontend

`sweetbook-frontend`는 SweetBook 프로토타입의 프론트엔드 애플리케이션입니다.  
React와 Vite 기반으로 동작하며, 그룹 기반 사진 수집부터 사진 선택, 스프레드 구성, 주문 전달까지의 사용자 흐름을 제공합니다.

## 개요

이 애플리케이션은 다음 사용자 흐름을 담당합니다.

- 공개 랜딩 페이지
- 회원가입 / 로그인
- 메인 대시보드
- 그룹 상세 페이지
- 이벤트 사진 업로드 / 좋아요
- 책에 넣을 사진 선택
- 스프레드 구성
- SweetBook 주문 전달
- 내 계정 관리

## 기술 스택

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Vitest

## 실행 환경

### 필수 준비

frontend는 기본적으로 backend API에 프록시 연결됩니다.

기본 backend 주소:

```text
http://localhost:3000
```

backend가 먼저 실행 중이어야 로그인, 회원가입, workspace 로딩, 사진 업로드가 정상 동작합니다.

### 로컬 실행

```powershell
cd C:\Users\user\my-projects\sweetbook\sweetbook-frontend
npm install
npm run dev
```

기본 접속 주소:

```text
http://localhost:5173
```

## Vite 프록시

개발 서버는 `/api` 요청을 backend로 프록시합니다.

기본값:

```text
BACKEND_PROXY_TARGET=http://localhost:3000
```

필요하면 실행 환경에서 `BACKEND_PROXY_TARGET`을 바꿔 다른 backend를 바라보게 할 수 있습니다.

## 주요 라우트

### 공개 화면

- `/`
  랜딩 페이지
- `/signup`
  회원가입
- `/login`
  로그인

### 인증 후 화면

- `/app`
  메인 대시보드
- `/app/account`
  내 계정
- `/app/groups`
  그룹 페이지
- `/app/events`
  이벤트 페이지
- `/app/albums`
  책에 넣을 사진 선택
- `/app/spreads`
  스프레드 구성
- `/app/orders`
  주문 전달

## 현재 사용자 흐름

현재 MVP 프로토타입 기준 주요 흐름은 아래와 같습니다.

1. 로그인 또는 회원가입
2. 메인 화면에서 그룹 확인
3. 그룹 페이지에서 이벤트 생성 또는 이벤트 진입
4. 이벤트 페이지에서 사진 업로드와 좋아요
5. 책에 넣을 사진 선택
6. 스프레드 구성
7. 주문 전달

## 스프레드 구성 단계

`/app/spreads`는 편집기 성격의 화면입니다.

현재 동작 방식:

- 커버 선택
- 페이지 레이아웃 선택
- 페이지 메모 수정
- 슬롯 클릭 후 사진 선택
- 페이지별 배치 확인

이 단계의 변경은 먼저 프론트엔드 draft 상태에서 반응합니다.  
사용자가 `책 구성 확정 후 주문으로`를 눌렀을 때 backend에 저장되고 주문 단계로 이동합니다.

## 인증과 세션

현재 인증은 backend의 JWT 프로토타입 구현을 사용합니다.

frontend 동작:

- 로그인 성공 시 토큰 저장
- 앱 재진입 시 세션 복원 시도
- 인증이 필요한 경로는 세션이 없으면 로그인 흐름으로 이동

## 디자인 방향

현재 UI는 아래 방향으로 정리 중입니다.

- 그룹 기반 정보 구조
- 단계형 편집 흐름
- 모달 중심 피드백
- 로그인/회원가입/계정/주문 화면의 일관된 카드형 레이아웃
- Tailwind 기반 공통 스타일

## 테스트

전체 테스트:

```powershell
npm test
```

watch 모드:

```powershell
npm run test:watch
```

## 디렉토리 구조

```text
src/
  application/   프론트용 상태/뷰모델 계산
  data/          API 클라이언트
  presentation/  AppShell, 화면 컴포넌트, 공통 UI
tests/           프론트엔드 테스트
```

## backend와의 관계

이 저장소는 `sweetbook-backend`와 함께 동작합니다.

backend가 담당하는 것:

- 인증
- workspace snapshot
- 사진 업로드
- 그룹/이벤트/좋아요/주문 상태 저장
- SweetBook estimate / submit

frontend가 담당하는 것:

- 사용자 화면
- 단계형 편집 경험
- 임시 draft 상호작용
- 모달/폼/페이지 흐름

## 현재 성격

이 저장소는 production-ready 서비스보다는 프로토타입 및 MVP 검증에 초점을 맞추고 있습니다.

현재 포함 범위:

- 그룹 기반 사용자 흐름
- 이벤트 사진 업로드 / 좋아요
- 오너 사진 선택
- 스프레드 구성 UX
- SweetBook 주문 전달 프로토타입

추후 추가 정리가 필요한 영역:

- 테스트와 최신 한글 UI 문구 정합성
- 상세 접근성 점검
- 완전한 실서비스용 상태 관리와 오류 복구 UX
