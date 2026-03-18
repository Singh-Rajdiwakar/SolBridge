import type { ReactNode } from "react";

import { PageHeader as BasePageHeader } from "@/components/dashboard/page-header";

export function PageHeader({
  title,
  subtitle,
  rightContent,
}: {
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
}) {
  return <BasePageHeader title={title} subtitle={subtitle || ""} action={rightContent} />;
}
