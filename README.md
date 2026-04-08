# sweetbook-frontend

`sweetbook-frontend`는 SweetBook 프로토타입의 사용자 화면을 담당하는 프론트엔드 애플리케이션입니다.

주요 화면:

- 랜딩
- 회원가입 / 로그인
- 메인 대시보드
- 그룹 페이지
- 이벤트 페이지
- 책에 넣을 사진 선택
- 스프레드 구성
- 주문 진행
- 내 계정

## 기술 스택

- React
- TypeScript
- Vite
- Tailwind CSS
- Vitest

## 로컬 실행

```powershell
cd sweetbook-frontend
npm install
npm run dev
```

접속:

```text
http://localhost:5173
```

주의:

- backend가 먼저 실행 중이어야 로그인, 회원가입, 워크스페이스 로딩, 사진 업로드가 정상 동작합니다

## 테스트

```powershell
npm test
```

저장소 단독 실행과 테스트 절차는 아래 문서를 참고하세요.

- [TESTING.md](C:/Users/user/my-projects/sweetbook/sweetbook-frontend/TESTING.md)

프로젝트 전체를 Docker로 함께 실행하는 방법은 `sweetbook-harness`를 참고하세요.

- [sweetbook-harness/TESTING.md](C:/Users/user/my-projects/sweetbook/sweetbook-harness/TESTING.md)

## 주요 흐름

1. 로그인 또는 회원가입
2. 그룹 생성 또는 그룹 진입
3. 이벤트 생성
4. 사진 업로드와 좋아요
5. 책에 넣을 사진 선택
6. 스프레드 구성
7. 주문과 SweetBook 견적 확인

## backend와의 관계

frontend는 `sweetbook-backend`의 API를 사용합니다.

주요 의존 기능:

- 인증
- workspace snapshot
- 사진 업로드
- 그룹 / 이벤트 생성
- 주문 상태와 SweetBook estimate / submit

## 현재 범위

이 저장소는 과제 제출과 MVP 검증을 위한 프로토타입 UI를 중심으로 구성되어 있습니다.
