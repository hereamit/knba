import { AdminLoginForm } from "@/components/admin-login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e9eef7] p-4">
      <div className="w-full max-w-md rounded-[1.8rem] bg-white p-6 shadow-[0_28px_65px_rgba(18,31,69,0.16)] md:p-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-primary-soft">
            KNBA Admin Portal
          </p>
        </div>
        <section>
          <AdminLoginForm />
        </section>
      </div>
    </div>
  );
}
