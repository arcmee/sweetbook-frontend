import type { ReactElement } from "react";

type PrimaryActionProps = {
  label: string;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void | Promise<void>;
  type?: "button" | "submit";
};

export function PrimaryAction({
  label,
  disabled = false,
  fullWidth = false,
  onClick,
  type = "button",
}: PrimaryActionProps): ReactElement {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 ${fullWidth ? "w-full" : ""}`}
    >
      {label}
    </button>
  );
}
