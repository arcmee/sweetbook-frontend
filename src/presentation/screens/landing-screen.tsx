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
    <section aria-label="groupictures landing">
      <p>groupictures</p>
      <h1>함께 찍은 사진을 한 권의 이야기로</h1>
      <p>
        그룹 사진을 모으고, 함께 고르고, SweetBook 작업까지 이어지는 그룹 기반
        포토북 워크플로우입니다.
      </p>
      <div>
        <PrimaryAction label="시작하기" onClick={onOpenSignup} />
        <PrimaryAction label="로그인" onClick={onOpenLogin} />
      </div>
      <ul>
        <li>그룹별 이벤트를 모아 관리</li>
        <li>구성원들은 사진 업로드와 좋아요 참여</li>
        <li>오너는 최종 사진 선택 후 책 주문 진행</li>
      </ul>
      <p>이미 계정이 있다면 로그인에서 바로 워크스페이스로 이동할 수 있습니다.</p>
    </section>
  );
}
