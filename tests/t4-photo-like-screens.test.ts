import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  getPrototypePhotoWorkflowViewModel,
  getPrototypeWorkspaceViewModel,
} from "../src/application/prototype-workspace";
import { buildAppShell } from "../src/presentation/app";

const demoSession = {
  token: "ptok_123",
  user: {
    userId: "user-demo",
    username: "demo",
    displayName: "SweetBook Demo User",
    role: "owner",
  },
} as const;

describe("frontend photo upload and like screens", () => {
  it("provides event-scoped photo workflow data through the application boundary", () => {
    const workspace = getPrototypeWorkspaceViewModel();
    const workflow = getPrototypePhotoWorkflowViewModel(workspace.events[0]?.id ?? "");

    expect(workflow.activeEventName).toBe("First birthday album");
    expect(workflow.uploadState.pendingCount).toBe(3);
    expect(workflow.photos[0]?.likedByViewer).toBe(true);
    expect(workflow.photos[1]?.likeCount).toBe(9);
  });

  it("renders upload guidance and photo status inside the event screen", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "events", initialSession: demoSession }),
    );

    expect(markup).toContain("사진 업로드");
    expect(markup).toContain("새 사진 설명");
    expect(markup).toContain("사진 파일");
    expect(markup).toContain("대기 중 업로드 3건");
    expect(markup).toContain("이미 이벤트에 있는 사진 124장");
    expect(markup).toContain("Upload queue is local-only until backend adapters land.");
    expect(markup).toContain("투표 3일 연장");
    expect(markup).toContain("지금 투표 종료");
  });

  it("renders like feedback for event photos", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "events", initialSession: demoSession }),
    );

    expect(markup).toContain("좋아요 현황");
    expect(markup).toContain("좋아요");
    expect(markup).toContain("내가 좋아요함");
    expect(markup).toContain("좋아요 9개");
    expect(markup).toContain("선택된 파일 없음");
    expect(markup).toContain("후보 검토가 시작되기 전에 마음에 드는 사진을 골라보세요.");
  });
});
