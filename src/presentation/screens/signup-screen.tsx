import { useState, type FormEvent, type ReactElement } from "react";

import type { PrototypeAuthSession } from "../../application/prototype-auth";
import { requestPrototypeAuthSignup } from "../../data/prototype-api-client";
import { PrimaryAction } from "../ui/primary-action";
import { StatePanel } from "../ui/state-panel";

type SignupScreenProps = {
  onOpenLogin?: () => void;
  onSignup?: (session: PrototypeAuthSession) => void;
  requestSignup?: (input: {
    displayName: string;
    username: string;
    password: string;
  }) => Promise<PrototypeAuthSession>;
};

export function SignupScreen({
  onOpenLogin,
  onSignup,
  requestSignup = requestPrototypeAuthSignup,
}: SignupScreenProps): ReactElement {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    if (!displayName.trim() || !username.trim() || !password.trim()) {
      setError("표시 이름, 아이디, 비밀번호를 모두 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await requestSignup({
        displayName,
        username,
        password,
      });
      onSignup?.(session);
    } catch (signupError: unknown) {
      setError(signupError instanceof Error ? signupError.message : String(signupError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section aria-label="groupictures signup">
      <p>groupictures signup</p>
      <h1>시작하기</h1>
      <p>표시 이름과 계정 정보를 입력하고 그룹 기반 사진 흐름으로 들어갈 준비를 합니다.</p>
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
        <PrimaryAction
          label={isSubmitting ? "회원가입 중..." : "회원가입"}
          disabled={isSubmitting}
          type="submit"
        />
      </form>
      <p>이미 계정이 있나요?</p>
      <PrimaryAction label="로그인으로 이동" onClick={onOpenLogin} />
      {error ? <StatePanel tone="error" title="회원가입 입력 오류" description={error} /> : null}
    </section>
  );
}
