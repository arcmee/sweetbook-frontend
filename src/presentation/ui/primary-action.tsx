import type { ReactElement } from "react";

type PrimaryActionProps = {
  label: string;
  disabled?: boolean;
  onClick?: () => void | Promise<void>;
};

export function PrimaryAction({
  label,
  disabled = false,
  onClick,
}: PrimaryActionProps): ReactElement {
  return (
    <button type="button" disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
}
