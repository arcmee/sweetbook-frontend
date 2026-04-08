import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { buildAppShell } from "../src/presentation/app";
import { getPrototypeWorkspaceViewModel } from "../src/application/prototype-workspace";

const demoSession = {
  token: "ptok_123",
  user: {
    userId: "user-demo",
    username: "demo",
    displayName: "SweetBook Demo User",
    role: "owner",
  },
} as const;

describe("frontend group and event screens", () => {
  it("provides prototype workspace data through an application boundary", () => {
    const viewModel = getPrototypeWorkspaceViewModel();

    expect(viewModel.groupSummary.totalGroups).toBe(2);
    expect(viewModel.groupSummary.totalMembers).toBe(7);
    expect(viewModel.groups[0]?.name).toBe("Han family");
    expect(viewModel.events[0]?.groupName).toBe("Han family");
  });

  it("renders a group management screen with creation guidance", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "groups", initialSession: demoSession }),
    );

    expect(markup).toContain("그룹 페이지");
    expect(markup).toContain("SweetBook 작업");
    expect(markup).toContain("이 그룹의 이벤트");
    expect(markup).toContain("멤버 관리");
    expect(markup).toContain("이 그룹에 이벤트 만들기");
    expect(markup).toContain("이벤트 설명");
    expect(markup).toContain("투표 시작");
    expect(markup).toContain("Han family");
    expect(markup).toContain("그룹 구성원");
    expect(markup).toContain("멤버 관리");
  });

  it("renders a main dashboard grouped by family events", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "dashboard", initialSession: demoSession }),
    );

    expect(markup).toContain("현재 진행 중인 그룹 투표");
    expect(markup).toContain("워크스페이스 요약");
    expect(markup).toContain("지금 필요한 작업");
    expect(markup).toContain("그룹 초대 검토");
    expect(markup).toContain("초대 수락");
    expect(markup).toContain("우선 그룹");
    expect(markup).toContain("투표 진행 중");
    expect(markup).toContain("그룹 페이지 열기");
    expect(markup).toContain("Han family");
    expect(markup).toContain("First birthday album");
  });

  it("renders an event management screen with a selected group context", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "events", initialSession: demoSession }),
    );

    expect(markup).toContain("이벤트 페이지");
    expect(markup).toContain("현재 그룹");
    expect(markup).toContain("First birthday album");
    expect(markup).toContain("Collect the best first birthday moments before the family vote closes.");
    expect(markup).toContain("구성원들이 이 이벤트 사진을 올리고, 진행 중인 기간 동안 좋아요에 참여합니다.");
    expect(markup).toContain("진행 단계");
    expect(markup).toContain("투표 상태");
    expect(markup).toContain("투표 기간:");
    expect(markup).toContain("오너 투표 제어");
  });
});
