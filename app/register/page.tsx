"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          phone,
          address,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Registration failed.");
        return;
      }

      setSuccess("Account created successfully! Redirecting you to login...");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch {
      setError("Unable to connect to the authentication server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F5F0] text-[#25231F] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-4xl rounded-3xl bg-white border border-[#EDE8DF] shadow-[0_20px_60px_rgba(37,35,31,0.06)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Editorial Visual (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-[#25231F] text-white p-10 flex-col justify-between overflow-hidden">
          {/* Background image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop"
            alt="IntelliShop Registration"
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
              Customer Membership
            </p>
            <h2 className="font-editorial text-2xl font-light leading-snug">
              Join an intelligent shopping ecosystem built with relational integrity.
            </h2>
            <p className="text-xs text-[#DDD6C9] leading-relaxed">
              Create your account to unlock personalized search histories, persistent wishlists,
              and seamless doorstep ordering.
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
                New Customer
              </p>
              <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#25231F]">
                Create your account
              </h1>
              <p className="text-xs text-[#77736D] mt-1">
                Fill in your details below to register.
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3 text-sm text-[#25231F] placeholder-[#A5A19B] transition-all focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3 text-sm text-[#25231F] placeholder-[#A5A19B] transition-all focus:bg-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F]">
                    Password * (Min 8 Characters)
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
                  minLength={8}
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3 text-sm text-[#25231F] placeholder-[#A5A19B] transition-all focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-1.5">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit number"
                    className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3 text-sm text-[#25231F] placeholder-[#A5A19B] transition-all focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-1.5">
                    Delivery Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="City, postal address"
                    className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3 text-sm text-[#25231F] placeholder-[#A5A19B] transition-all focus:bg-white"
                  />
                </div>
              </div>

              {/* Status Messages */}
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-800">
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#25231F] py-3.5 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0] hover:bg-[#9B8065] active:scale-[0.99] transition-all duration-200 shadow-sm disabled:opacity-50 mt-2"
              >
                {loading ? "Creating Account..." : "Complete Registration"}
              </button>
            </form>
          </div>

          {/* Footer Link */}
          <div className="mt-6 pt-5 border-t border-[#EDE8DF] text-center space-y-2">
            <p className="text-xs text-[#77736D]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#80664E] hover:text-[#25231F] transition-colors underline decoration-[#EDE8DF]"
              >
                Sign In
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
