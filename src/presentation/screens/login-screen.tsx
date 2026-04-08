import { useState, type FormEvent, type ReactElement } from "react";

import {
  prototypeDemoCredentials,
  type PrototypeAuthSession,
} from "../../application/prototype-auth";
import { requestPrototypeAuthLogin } from "../../data/prototype-api-client";
import { PrimaryAction } from "../ui/primary-action";
import { StatePanel } from "../ui/state-panel";

type LoginScreenProps = {
  onLogin?: (session: PrototypeAuthSession) => void;
  onOpenSignup?: () => void;
  requestLogin?: (input: {
    username: string;
    password: string;
  }) => Promise<PrototypeAuthSession>;
};

export function LoginScreen({
  onLogin,
  onOpenSignup,
  requestLogin = requestPrototypeAuthLogin,
}: LoginScreenProps): ReactElement {
  const [username, setUsername] = useState(prototypeDemoCredentials.username);
  const [password, setPassword] = useState(prototypeDemoCredentials.password);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const session = await requestLogin({ username, password });
      onLogin?.(session);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
      <div className="grid gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
          로그인
        </p>
        <div className="grid gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            groupictures에 다시 들어오기
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
            아이디와 비밀번호를 입력하면 그룹 사진 모음, 투표, SweetBook 작업 화면으로
            바로 이어집니다.
          </p>
        </div>

        <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <h2 className="text-base font-semibold text-slate-950">로그인 후 할 수 있는 일</h2>
          <ul className="grid gap-2">
            <li>그룹에 들어가 이벤트와 멤버를 확인합니다.</li>
            <li>이벤트 사진을 업로드하고 좋아요를 남깁니다.</li>
            <li>오너라면 사진을 고르고 스프레드를 구성한 뒤 주문으로 이어집니다.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur md:p-8">
        <div className="grid gap-2">
          <p className="text-sm font-semibold text-slate-500">계정 로그인</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            계정 정보를 입력해주세요
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            입력한 계정으로 워크스페이스를 불러옵니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            아이디
            <input
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
              placeholder="아이디를 입력하세요"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            비밀번호
            <input
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
              placeholder="비밀번호를 입력하세요"
            />
          </label>

          <PrimaryAction
            label={isSubmitting ? "로그인 중..." : "로그인"}
            disabled={isSubmitting}
            type="submit"
          />
        </form>

        <div className="mt-4">
          <StatePanel
            tone="empty"
            title="테스트용 기본 계정"
            description={`${prototypeDemoCredentials.username} / ${prototypeDemoCredentials.password}`}
          />
        </div>

        {errorMessage ? (
          <div className="mt-4">
            <StatePanel
              tone="error"
              title="로그인에 실패했습니다"
              description={errorMessage}
            />
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="grid gap-1">
            <p className="text-sm font-medium text-slate-900">아직 계정이 없나요?</p>
            <p className="text-sm text-slate-600">
              회원가입 후 바로 그룹 사진 작업을 시작할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSignup}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            회원가입
          </button>
        </div>
      </div>
    </section>
  );
}
