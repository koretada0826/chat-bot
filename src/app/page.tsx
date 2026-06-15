import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/context";

// トップに来たら、ログイン済みなら管理画面、未ログインならログインへ
export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/admin");
  redirect("/login");
}
