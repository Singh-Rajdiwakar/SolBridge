import { ArrowRight } from "lucide-react";

import { GradientButton } from "@/components/dashboard/gradient-button";
import type { ButtonProps } from "@/components/ui/button";

export function ActionButton({ children, ...props }: ButtonProps) {
  return (
    <GradientButton {...props}>
      {children}
      <ArrowRight className="h-4 w-4" />
    </GradientButton>
  );
}
