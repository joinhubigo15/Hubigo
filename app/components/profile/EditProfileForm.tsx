"use client";

import { useState } from "react";
import Button from "@/app/components/ui/Button";
import { updateProfileRequest } from "@/app/lib/api";
import { useAuth, ApiClientError } from "@/app/lib/auth-context";

export default function EditProfileForm() {
  const { user, accessToken, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!user || !accessToken) return null;

  const currentEmail = user.email;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const updated = await updateProfileRequest(accessToken, {
        name,
        email,
        phone: phone || undefined,
      });
      updateUser(updated);
      setSuccessMsg(
        updated.email !== currentEmail
          ? "Profile updated — check your new email address to re-verify it"
          : "Profile updated"
      );
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white px-8 py-10 border-b border-slate-200/90">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
        {errorMsg && (
          <div className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Mobile Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your mobile number"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors shadow-2xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors shadow-2xs"
          />
        </div>

        <div className="pt-2">
          <Button variant="primary" size="md" className="w-fit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
