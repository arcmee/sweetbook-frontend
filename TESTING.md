# frontend 테스트 안내

이 문서는 `sweetbook-frontend` 저장소를 단독으로 확인하거나, 전체 통합 실행 문서로 이동하기 위한 간단한 안내입니다.

## 단독 실행

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

## 통합 실행

postgres, backend, frontend를 함께 묶어 검증하려면 `sweetbook-harness`를 기준으로 실행합니다.

참고 문서:

- [sweetbook-harness/TESTING.md](C:/Users/user/my-projects/sweetbook/sweetbook-harness/TESTING.md)
