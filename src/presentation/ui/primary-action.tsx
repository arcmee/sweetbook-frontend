import type { ReactElement } from "react";

type PrimaryActionProps = {
  label: string;
  disabled?: boolean;
};

export function PrimaryAction({
  label,
  disabled = false,
}: PrimaryActionProps): ReactElement {
  return (
    <button type="button" disabled={disabled}>
      {label}
    </button>
  );
}
