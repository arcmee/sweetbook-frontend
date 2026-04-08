import type { ChangeEvent, FormEvent, ReactElement } from "react";

import type { PrototypePhotoWorkflowViewModel } from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";

type PhotoWorkflowSectionProps = {
  canVote?: boolean;
  createPhotoCaption?: string;
  createPhotoFileName?: string;
  createPhotoPreviewUrl?: string;
  isCreatingPhoto?: boolean;
  isLikingPhoto?: boolean;
  onCreatePhoto?: () => void | Promise<void>;
  onCreatePhotoCaptionChange?: (value: string) => void;
  onCreatePhotoFileChange?: (file: File | null) => void;
  onLikePhoto?: (photoId: string) => void | Promise<void>;
  workflow: PrototypePhotoWorkflowViewModel;
};

export function PhotoWorkflowSection({
  canVote = true,
  createPhotoCaption = "",
  createPhotoFileName,
  createPhotoPreviewUrl,
  isCreatingPhoto = false,
  isLikingPhoto = false,
  onCreatePhoto,
  onCreatePhotoCaptionChange,
  onCreatePhotoFileChange,
  onLikePhoto,
  workflow,
}: PhotoWorkflowSectionProps): ReactElement {
  const uploadHelperText =
    workflow.uploadState.helperText === "Upload queue is local-only until backend adapters land."
      ? "사진을 업로드하면 이 이벤트의 사진 목록에 바로 반영됩니다."
      : workflow.uploadState.helperText;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void onCreatePhoto?.();
  }

  function handleCaptionChange(event: ChangeEvent<HTMLInputElement>): void {
    onCreatePhotoCaptionChange?.(event.target.value);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    onCreatePhotoFileChange?.(event.target.files?.[0] ?? null);
  }

  return (
    <PageSection
      eyebrow="사진 작업"
      title="사진 업로드와 좋아요"
      description="이 이벤트에 맞는 사진을 올리고, 마음에 드는 사진에는 좋아요를 눌러 우선순위를 표시합니다."
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5"
        >
          <div>
            <h3 className="text-lg font-semibold text-slate-950">새 사진 올리기</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              사진 설명을 적고 파일을 선택하면 바로 미리보기로 확인할 수 있습니다.
            </p>
          </div>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            사진 설명
            <input
              name="photoCaption"
              value={createPhotoCaption}
              onChange={handleCaptionChange}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
              placeholder="예: 바닷가 단체 사진"
            />
          </label>

          <div className="grid gap-3">
            <p className="text-sm font-medium text-slate-700">사진 파일</p>
            <label className="grid cursor-pointer gap-3 rounded-3xl border-2 border-dashed border-slate-300 bg-white px-5 py-6 transition hover:border-teal-400 hover:bg-teal-50/40">
              <div className="grid gap-1 text-center">
                <strong className="text-base font-semibold text-slate-950">
                  파일을 선택하거나 이 영역에 끌어다 놓으세요
                </strong>
                <p className="text-sm text-slate-600">
                  JPG, PNG 같은 이미지 파일을 바로 올릴 수 있습니다.
                </p>
              </div>
              <div className="flex justify-center">
                <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                  사진 파일 고르기
                </span>
              </div>
              <input
                accept="image/*"
                name="photoFile"
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            {createPhotoFileName
              ? `선택한 파일: ${createPhotoFileName}`
              : "아직 선택한 파일이 없습니다."}
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {createPhotoPreviewUrl ? (
              <img
                src={createPhotoPreviewUrl}
                alt="선택한 사진 미리보기"
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 px-6 text-center text-sm text-slate-500">
                사진을 선택하면 여기에서 미리보기가 보입니다.
              </div>
            )}
          </div>

          <div className="grid gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            <p>대기 중 업로드: {workflow.uploadState.pendingCount}건</p>
            <p>이 이벤트에 연결된 사진: {workflow.uploadState.uploadedCount}장</p>
            <p>{uploadHelperText}</p>
          </div>

          <div>
            <PrimaryAction
              label={isCreatingPhoto ? "사진 업로드 중..." : "이벤트 사진 업로드"}
              disabled={
                isCreatingPhoto ||
                createPhotoCaption.trim().length === 0 ||
                !createPhotoFileName
              }
              type="submit"
            />
          </div>
        </form>

        <div className="grid gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">사진 그리드</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              업로드된 사진을 한눈에 보고, 투표가 열려 있는 동안 좋아요를 남길 수 있습니다.
            </p>
          </div>

          {workflow.photos.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {workflow.photos.map((photo) => (
                <li
                  key={photo.id}
                  className="flex h-full min-w-0 flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  {photo.assetUrl ? (
                    <img
                      alt={`${photo.caption} 미리보기`}
                      src={photo.assetUrl}
                      className="aspect-[4/3] w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
                      미리보기가 없습니다.
                    </div>
                  )}

                  <div className="grid min-w-0 flex-1 gap-1">
                    <strong className="text-base font-semibold text-slate-950">
                      {photo.caption}
                    </strong>
                    <p className="text-sm text-slate-600">업로드: {photo.uploadedBy}</p>
                    <p className="text-sm text-slate-600">좋아요 {photo.likeCount}개</p>
                    <p className="text-sm text-slate-500">
                      {photo.likedByViewer
                        ? "내가 이미 좋아요를 남긴 사진입니다."
                        : "아직 좋아요를 누르지 않았습니다."}
                    </p>
                    <p className="text-xs text-slate-500 break-all">
                      {photo.assetFileName ?? "파일 이름 정보가 없습니다."}
                    </p>
                  </div>

                  <div className="pt-2">
                    <PrimaryAction
                      label={isLikingPhoto ? "좋아요 저장 중..." : "좋아요"}
                      disabled={isLikingPhoto || photo.likedByViewer || !canVote}
                      fullWidth
                      onClick={() => onLikePhoto?.(photo.id)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-sm text-slate-600">
              아직 업로드된 사진이 없습니다. 왼쪽 카드에서 첫 사진을 올려보세요.
            </div>
          )}
        </div>
      </div>
    </PageSection>
  );
}
