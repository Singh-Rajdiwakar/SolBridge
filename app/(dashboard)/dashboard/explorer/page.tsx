import { redirect } from "next/navigation";

export default function ExplorerRoutePage() {
  redirect("/dashboard/devtools?tab=explorer");
}
