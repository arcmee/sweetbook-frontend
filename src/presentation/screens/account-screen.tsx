import type { ReactElement } from "react";

import type { PrototypeAuthSession } from "../../application/prototype-auth";
import type { PrototypeWorkspaceViewModel } from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";

type AccountScreenProps = {
  currentPassword: string;
  isChangingPassword?: boolean;
  nextPassword: string;
  onCurrentPasswordChange?: (value: string) => void;
  onGroupOpen?: (groupId: string) => void;
  onLogout?: () => void | Promise<void>;
  onPasswordChange?: () => void | Promise<void>;
  onNextPasswordChange?: (value: string) => void;
  session: PrototypeAuthSession;
  workspace: PrototypeWorkspaceViewModel;
};

export function AccountScreen({
  currentPassword,
  isChangingPassword = false,
  nextPassword,
  onCurrentPasswordChange,
  onGroupOpen,
  onLogout,
  onPasswordChange,
  onNextPasswordChange,
  session,
  workspace,
}: AccountScreenProps): ReactElement {
  return (
    <div className="grid gap-6">
      <PageSection
        eyebrow="계정"
        title="내 계정"
        description="계정 기본 정보와 내가 속한 그룹, 비밀번호를 이 페이지에서 관리합니다."
      >
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto] md:items-start">
          <div className="grid gap-2 text-sm text-slate-700">
            <p>
              이름: <span className="font-medium text-slate-950">{session.user.displayName}</span>
            </p>
            <p>
              아이디: <span className="font-medium text-slate-950">@{session.user.username}</span>
            </p>
          </div>
          <div>
            <PrimaryAction label="로그아웃" onClick={onLogout} />
          </div>
        </div>
      </PageSection>

      <PageSection
        eyebrow="내 그룹"
        title="참여 중인 그룹"
        description="내가 속한 그룹 목록을 보고, 바로 그룹 페이지로 이동할 수 있습니다."
      >
        {workspace.groups.length > 0 ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {workspace.groups.map((group) => (
              <li
                key={group.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <strong className="text-lg font-semibold text-slate-950">{group.name}</strong>
                <div className="mt-3 grid gap-1 text-sm text-slate-600">
                  <p>내 역할: {group.role}</p>
                  <p>멤버 {group.memberCount}명</p>
                  <p>이벤트 {group.eventCount}개</p>
                </div>
                <div className="mt-4">
                  <PrimaryAction
                    label="그룹 페이지 열기"
                    onClick={() => onGroupOpen?.(group.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-sm text-slate-600">
            아직 참여 중인 그룹이 없습니다.
          </div>
        )}
      </PageSection>

      <PageSection
        eyebrow="보안"
        title="비밀번호 변경"
        description="현재 비밀번호와 새 비밀번호를 입력하면 바로 비밀번호를 변경할 수 있습니다."
      >
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:max-w-xl">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            현재 비밀번호
            <input
              name="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(event) => onCurrentPasswordChange?.(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            새 비밀번호
            <input
              name="nextPassword"
              type="password"
              value={nextPassword}
              onChange={(event) => onNextPasswordChange?.(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
            />
          </label>
          <div>
            <PrimaryAction
              label={isChangingPassword ? "비밀번호 변경 중..." : "비밀번호 변경"}
              disabled={isChangingPassword}
              onClick={onPasswordChange}
            />
          </div>
        </div>
      </PageSection>
    </div>
  );
}
