import type { ReactElement } from "react";

type PrimaryActionProps = {
  label: string;
  disabled?: boolean;
  onClick?: () => void | Promise<void>;
  type?: "button" | "submit";
};

export function PrimaryAction({
  label,
  disabled = false,
  onClick,
  type = "button",
}: PrimaryActionProps): ReactElement {
  return (
    <button type={type} disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
}
