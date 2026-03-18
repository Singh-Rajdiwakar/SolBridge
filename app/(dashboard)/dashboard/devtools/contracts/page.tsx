import { redirect } from "next/navigation";

export default function DevtoolsContractsRoute() {
  redirect("/dashboard/devtools?tab=contracts");
}
