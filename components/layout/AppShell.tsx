import type { ReactNode } from "react";

import { AppShell as BaseAppShell } from "@/components/layout/app-shell";

export function AppShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <BaseAppShell>
      {title ? <div className="sr-only">{title}</div> : null}
      {children}
    </BaseAppShell>
  );
}
