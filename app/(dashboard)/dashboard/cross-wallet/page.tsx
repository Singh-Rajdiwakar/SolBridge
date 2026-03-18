import { redirect } from "next/navigation";

export default function CrossWalletPage() {
  redirect("/dashboard/analytics?tab=cross-wallet");
}
