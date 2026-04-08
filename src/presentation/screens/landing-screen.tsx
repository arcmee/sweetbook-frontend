import type { ReactElement } from "react";

import { PrimaryAction } from "../ui/primary-action";

type LandingScreenProps = {
  onOpenLogin?: () => void;
  onOpenSignup?: () => void;
};

export function LandingScreen({
  onOpenLogin,
  onOpenSignup,
}: LandingScreenProps): ReactElement {
  return (
    <section
      aria-label="groupictures 시작 화면"
      className="grid gap-8 rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur md:grid-cols-[1.25fr_0.9fr] md:p-12"
    >
      <div className="grid gap-6">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700">
          groupictures
        </p>
        <div className="grid gap-4">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
            함께 찍은 사진을
            <br />
            한 권의 이야기로
          </h1>
          <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
            그룹 사진을 모으고, 함께 투표하고, 오너가 최종 구성을 정한 뒤 SweetBook
            작업까지 이어가는 흐름을 한 곳에서 관리합니다.
          </p>
        </div>

        <ul className="grid gap-3 text-sm leading-7 text-slate-700">
          <li>가족과 친구를 그룹으로 모아 함께 사진을 관리할 수 있습니다.</li>
          <li>구성원은 사진을 올리고 좋아요로 우선순위를 남길 수 있습니다.</li>
          <li>그룹 오너는 최종 사진을 선택하고 책 주문까지 마무리할 수 있습니다.</li>
        </ul>
      </div>

      <div className="grid content-start gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-inner">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">바로 시작하기</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            처음 사용하는 사람은 회원가입으로 시작하고, 이미 계정이 있다면 바로 로그인하면
            됩니다.
          </p>
        </div>
        <div className="grid gap-3">
          <PrimaryAction label="시작하기" onClick={onOpenSignup} />
          <button
            type="button"
            onClick={onOpenLogin}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-100"
          >
            로그인
          </button>
        </div>
      </div>
    </section>
  );
}
