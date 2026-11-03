import { AuthForm } from "@/components/auth-form";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  return (
    <main className="auth-page">
      <AuthForm initialMode={mode === "register" ? "register" : "login"} />
    </main>
  );
}
