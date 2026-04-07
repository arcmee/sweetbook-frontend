import { useState, type FormEvent, type ReactElement } from "react";

import { PrimaryAction } from "../ui/primary-action";
import { StatePanel } from "../ui/state-panel";

type SignupScreenProps = {
  onOpenLogin?: () => void;
};

export function SignupScreen({ onOpenLogin }: SignupScreenProps): ReactElement {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!displayName.trim() || !username.trim() || !password.trim()) {
      setError("표시 이름, 아이디, 비밀번호를 모두 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setMessage(
      `${displayName} 님의 groupictures 가입 화면이 준비되었습니다. 다음 단계에서 실제 가입 API를 연결할 수 있습니다.`,
    );
  }

  return (
    <section aria-label="groupictures signup">
      <p>groupictures signup</p>
      <h1>시작하기</h1>
      <p>표시 이름과 계정 정보를 입력하고 그룹 기반 워크플로우에 들어갈 준비를 합니다.</p>
      <form onSubmit={handleSubmit}>
        <label>
          표시 이름
          <input
            name="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
        <label>
          아이디
          <input
            name="signupUsername"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          비밀번호
          <input
            name="signupPassword"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label>
          비밀번호 확인
          <input
            name="signupPasswordConfirm"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
        <PrimaryAction label="회원가입" type="submit" />
      </form>
      <p>이미 계정이 있나요?</p>
      <PrimaryAction label="로그인으로 이동" onClick={onOpenLogin} />
      {message ? (
        <StatePanel tone="success" title="회원가입 화면 준비 완료" description={message} />
      ) : null}
      {error ? <StatePanel tone="error" title="회원가입 입력 오류" description={error} /> : null}
    </section>
  );
}
