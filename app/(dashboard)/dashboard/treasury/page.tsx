import { redirect } from "next/navigation";

export default function TreasuryRoutePage() {
  redirect("/dashboard/governance?tab=treasury");
}
