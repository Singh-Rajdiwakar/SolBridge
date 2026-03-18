import { redirect } from "next/navigation";

export default function TaxPage() {
  redirect("/dashboard/analytics?tab=tax-reports");
}
