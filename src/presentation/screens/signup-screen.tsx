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
    <section className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
      <div className="grid gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
          회원가입
        </p>
        <div className="grid gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            groupictures 시작하기
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
            계정을 만들면 그룹 사진을 모으고, 함께 고르고, SweetBook 작업까지 이어지는
            흐름에 바로 참여할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <h2 className="text-base font-semibold text-slate-950">회원가입 후 할 수 있는 일</h2>
          <ul className="grid gap-2">
            <li>그룹을 만들고 멤버를 초대합니다.</li>
            <li>이벤트를 만들고 사진을 업로드하거나 좋아요를 남깁니다.</li>
            <li>오너라면 사진 선택, 스프레드 구성, 주문 단계까지 이어갈 수 있습니다.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur md:p-8">
        <div className="grid gap-2">
          <p className="text-sm font-semibold text-slate-500">새 계정 만들기</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            기본 계정 정보를 입력해주세요
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            표시 이름은 그룹 멤버 목록과 사진 업로더 이름에 바로 사용됩니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            표시 이름
            <input
              name="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
              placeholder="예: 김민지"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            아이디
            <input
              name="signupUsername"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
              placeholder="아이디를 입력하세요"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            비밀번호
            <input
              name="signupPassword"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
              placeholder="8자 이상 입력하세요"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            비밀번호 확인
            <input
              name="signupPasswordConfirm"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
              placeholder="비밀번호를 다시 입력하세요"
            />
          </label>

          <PrimaryAction
            label={isSubmitting ? "회원가입 중..." : "회원가입"}
            disabled={isSubmitting}
            type="submit"
          />
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="grid gap-1">
            <p className="text-sm font-medium text-slate-900">이미 계정이 있나요?</p>
            <p className="text-sm text-slate-600">
              기존 계정으로 로그인해서 바로 작업을 이어갈 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenLogin}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            로그인으로 이동
          </button>
        </div>

        {error ? (
          <div className="mt-4">
            <StatePanel tone="error" title="회원가입 입력 오류" description={error} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
