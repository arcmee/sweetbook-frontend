import type { ReactElement } from "react";

import type {
  PrototypeCandidateReviewViewModel,
  PrototypeOrderEntryViewModel,
  PrototypePhotoWorkflowViewModel,
  PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";

type AlbumCandidateScreenProps = {
  activeGroupName?: string;
  activeEventName?: string;
  coverPhotoId?: string;
  onOpenPlanner?: () => void;
  orderEntry?: PrototypeOrderEntryViewModel;
  selectedPhotoIds?: string[];
  workflow?: PrototypePhotoWorkflowViewModel;
  onSetCoverPhoto?: (photoId: string) => void;
  onTogglePhotoSelection?: (photoId: string) => void;
  workspace: PrototypeWorkspaceViewModel;
  review?: PrototypeCandidateReviewViewModel;
};

type WorkflowPhoto = PrototypePhotoWorkflowViewModel["photos"][number];

export function AlbumCandidateScreen({
  activeGroupName,
  activeEventName,
  coverPhotoId,
  onOpenPlanner,
  orderEntry,
  selectedPhotoIds = [],
  workflow,
  onSetCoverPhoto,
  onTogglePhotoSelection,
  workspace,
  review,
}: AlbumCandidateScreenProps): ReactElement {
  const activeEvent =
    workspace.events.find((event) => event.name === activeEventName) ?? workspace.events[0];
  const activeReview = review ?? {
    activeEventId: activeEvent?.id ?? "",
    activeEventName: activeEvent?.name ?? "선택된 이벤트가 없습니다",
    candidates: [],
    pagePreview: [],
  };

  const availablePhotos = workflow?.photos ?? [];
  const activeOrderEntry = orderEntry;
  const minimumSelectedPhotoCount =
    activeOrderEntry?.readinessSummary?.minimumSelectedPhotoCount ?? 3;
  const effectiveSelectedPhotoIds =
    selectedPhotoIds.length > 0
      ? selectedPhotoIds
      : activeOrderEntry?.pagePlanner?.selectedPhotoIds ?? [];

  const selectedPhotos = availablePhotos.filter((photo) =>
    effectiveSelectedPhotoIds.includes(photo.id),
  );
  const coverPhoto =
    selectedPhotos.find((photo) => photo.id === coverPhotoId) ??
    selectedPhotos.find((photo) => photo.id === activeOrderEntry?.pagePlanner?.coverPhotoId) ??
    selectedPhotos[0];

  const canOpenPlanner =
    selectedPhotos.length >= minimumSelectedPhotoCount && Boolean(coverPhoto?.id);

  return (
    <div className="grid gap-6">
      <PageSection
        eyebrow="1단계"
        title="책에 넣을 사진 선택"
        description="먼저 책에 넣을 사진을 고르고, 선택된 사진 중 한 장을 커버로 지정합니다."
      >
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">
              현재 그룹: {activeGroupName ?? "선택된 그룹이 없습니다"}
            </p>
            <p className="text-sm text-slate-600">
              현재 이벤트: {activeEventName ?? activeReview.activeEventName}
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryCard label="선택된 사진" value={`${selectedPhotos.length}장`} />
              <SummaryCard label="최소 필요 수" value={`${minimumSelectedPhotoCount}장`} />
              <SummaryCard
                label="커버"
                value={coverPhoto?.caption ?? "아직 선택되지 않음"}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              {canOpenPlanner
                ? "사진 선택이 끝났습니다. 다음 단계에서 스프레드 구성을 확인할 수 있습니다."
                : "사진을 충분히 고르고 커버를 지정해야 다음 단계로 넘어갈 수 있습니다."}
            </div>

            <div className="flex flex-wrap gap-3">
              <PrimaryAction
                label="다음: 책 구성 확인"
                onClick={onOpenPlanner}
                disabled={!canOpenPlanner}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-950">현재 커버</h3>
            {coverPhoto ? (
              <div className="mt-4 grid gap-4">
                <PhotoPreviewCard photo={coverPhoto} />
                <div className="grid gap-1 text-sm text-slate-700">
                  <strong className="text-base text-slate-950">{coverPhoto.caption}</strong>
                  <p>업로드: {coverPhoto.uploadedBy}</p>
                  <p>좋아요 {coverPhoto.likeCount}개</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                아직 커버가 없습니다. 아래 사진 카드에서 선택된 사진을 커버로 지정해주세요.
              </p>
            )}
          </div>
        </div>
      </PageSection>

      <PageSection
        eyebrow="사진 선택"
        title="책에 넣을 사진 고르기"
        description="좋아요는 참고용입니다. 여기에서는 책에 넣을 사진을 고르고, 선택한 사진 중 하나를 커버로 지정합니다."
      >
        {availablePhotos.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {availablePhotos.map((photo) => {
              const isSelected = effectiveSelectedPhotoIds.includes(photo.id);
              const isCover = coverPhoto?.id === photo.id;
              const candidate = activeReview.candidates.find((item) => item.photoId === photo.id);

              return (
                <li
                  key={photo.id}
                  className={`grid gap-4 rounded-3xl border p-5 shadow-sm transition ${
                    isSelected
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
                  }`}
                >
                  <PhotoPreviewCard photo={photo} />

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge
                      tone={isSelected ? "selected" : "default"}
                      label={isSelected ? "선택됨" : "선택 전"}
                    />
                    {isCover ? <StatusBadge tone="cover" label="커버" /> : null}
                  </div>

                  <div className="grid gap-1">
                    <strong className="text-base font-semibold">{photo.caption}</strong>
                    <p className={isSelected ? "text-slate-200" : "text-slate-600"}>
                      좋아요 {photo.likeCount}개 · 업로드 {photo.uploadedBy}
                    </p>
                    <p className={isSelected ? "text-slate-200" : "text-slate-600"}>
                      {candidate?.whySelected ?? "이 사진에 대한 추천 메모가 아직 없습니다."}
                    </p>
                  </div>

                  <div className="grid gap-2">
                    {isSelected ? (
                      <PrimaryAction
                        label={isCover ? "현재 커버" : "커버로 지정"}
                        onClick={() => onSetCoverPhoto?.(photo.id)}
                        disabled={isCover}
                      />
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <PrimaryAction
                        label={isSelected ? "책에서 제외" : "책에 포함"}
                        onClick={() => onTogglePhotoSelection?.(photo.id)}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-sm text-slate-600">
            아직 업로드된 사진이 없습니다. 이벤트 페이지에서 사진을 올린 뒤 다시 선택해주세요.
          </div>
        )}
      </PageSection>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "selected" | "cover" | "default";
}): ReactElement {
  const className =
    tone === "cover"
      ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
      : tone === "selected"
        ? "rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white"
        : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700";

  return <span className={className}>{label}</span>;
}

function PhotoPreviewCard({ photo }: { photo: WorkflowPhoto }): ReactElement {
  if (photo.assetUrl) {
    return (
      <img
        src={photo.assetUrl}
        alt={`${photo.caption} 미리보기`}
        className="aspect-[4/3] w-full rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-slate-100 px-4 text-center text-sm text-slate-500">
      이미지 미리보기가 없습니다.
    </div>
  );
}
