"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Invalid email or password.");
        return;
      }

      if (data.user.role === "ADMIN") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }

      router.refresh();
    } catch {
      setError("Unable to connect to the authentication service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F5F0] text-[#25231F] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-4xl rounded-3xl bg-white border border-[#EDE8DF] shadow-[0_20px_60px_rgba(37,35,31,0.06)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Editorial Visual (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-[#25231F] text-white p-10 flex-col justify-between overflow-hidden">
          {/* Background image with luxury overlay */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=800&auto=format&fit=crop"
            alt="IntelliShop Architecture"
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#25231F] via-[#25231F]/50 to-transparent" />

          {/* Top Brand Monogram */}
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#25231F] font-editorial text-base font-bold">
                I
              </span>
              <span className="font-editorial text-xl font-semibold tracking-wide text-white">
                INTELLISHOP
              </span>
            </Link>
          </div>

          {/* Bottom Editorial Quote */}
          <div className="relative z-10 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#EDE8DF]">
              Intelligent Commerce
            </p>
            <h2 className="font-editorial text-2xl font-light leading-snug">
              Curated elegance driven by vector semantic intelligence.
            </h2>
            <p className="text-xs text-[#DDD6C9] leading-relaxed">
              Sign in to manage your bag, access personalized recommendations, and track purchase history.
            </p>
          </div>
        </div>

        {/* Right Form Container */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between mb-8">
              <Link href="/" className="inline-flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25231F] text-white font-editorial text-sm font-bold">
                  I
                </span>
                <span className="font-editorial text-lg font-semibold tracking-wide text-[#25231F]">
                  INTELLISHOP
                </span>
              </Link>

              <Link href="/" className="text-xs uppercase tracking-wider text-[#77736D]">
                Storefront →
              </Link>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B8065]">
                Welcome Back
              </p>
              <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#25231F]">
                Sign in to your account
              </h1>
              <p className="text-xs text-[#77736D] mt-1">
                Enter your registered email and password to continue.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3.5 text-sm text-[#25231F] placeholder-[#A5A19B] transition-all focus:bg-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F]">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] uppercase tracking-wider text-[#9B8065] hover:text-[#25231F] font-semibold"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your account password"
                  className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3.5 text-sm text-[#25231F] placeholder-[#A5A19B] transition-all focus:bg-white"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-700">
                  {error}
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#25231F] py-4 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0] hover:bg-[#9B8065] active:scale-[0.99] transition-all duration-200 shadow-sm disabled:opacity-50"
              >
                {loading ? "Authenticating..." : "Sign In to Account"}
              </button>
            </form>
          </div>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-[#EDE8DF] text-center space-y-3">
            <p className="text-xs text-[#77736D]">
              Don&apos;t have an IntelliShop account?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#80664E] hover:text-[#25231F] transition-colors underline decoration-[#EDE8DF]"
              >
                Create Account
              </Link>
            </p>

            <div>
              <Link
                href="/"
                className="text-xs text-[#A5A19B] hover:text-[#25231F] transition-colors"
              >
                ← Return to Public Storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
