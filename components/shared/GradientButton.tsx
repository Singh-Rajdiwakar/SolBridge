import type { ReactNode } from "react";

import { GradientButton as BaseGradientButton } from "@/components/dashboard/gradient-button";

export function GradientButton({
  children,
  onClick,
  variant = "primary",
  disabled,
  loading,
  type = "button",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}) {
  return (
    <BaseGradientButton
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      variant={variant === "primary" ? "default" : variant}
      className={className}
    >
      {loading ? "Working..." : children}
    </BaseGradientButton>
  );
}
