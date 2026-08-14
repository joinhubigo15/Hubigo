"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import Badge from "@/app/components/ui/Badge";
import { getInitials } from "@/app/lib/utils";
import { uploadAvatarRequest, removeAvatarRequest } from "@/app/lib/api";
import { useAuth, ApiClientError } from "@/app/lib/auth-context";

const roleLabel: Record<string, string> = {
  user: "Normal User",
  business_owner: "Business Owner",
  admin: "Admin",
  super_admin: "Super Admin",
};

export default function ProfileHeaderCard() {
  const { user, accessToken, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!user || !accessToken) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !accessToken) return;

    setErrorMsg(null);
    setBusy(true);
    try {
      const updated = await uploadAvatarRequest(accessToken, file);
      updateUser(updated);
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : "Could not upload image");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!accessToken) return;
    setErrorMsg(null);
    setBusy(true);
    try {
      const updated = await removeAvatarRequest(accessToken);
      updateUser(updated);
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : "Could not remove image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-8 py-10 flex flex-col items-center text-center gap-5 border-b border-slate-200/90 lg:border-none">
      <div className="relative flex-shrink-0">
        <div className="w-28 h-28 rounded-full bg-purple-50 border-[4px] border-white shadow-lg flex items-center justify-center overflow-hidden">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-black text-purple-600">{getInitials(user.name)}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center border-2 border-white shadow-sm hover:bg-purple-600 transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Change profile picture"
        >
          <Camera className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="flex flex-col items-center gap-3 w-full">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">{user.email}</p>
          {user.phone && <p className="text-sm text-slate-500 font-medium mt-0.5">+91 {user.phone}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          <Badge variant="category">{roleLabel[user.role] ?? user.role}</Badge>
          {user.emailVerified ? (
            <Badge variant="verified">Email Verified</Badge>
          ) : (
            <Badge variant="default">Email Unverified</Badge>
          )}
        </div>

        <div className="w-full h-[1px] bg-slate-200/80 my-3 hidden lg:block" />

        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Member since {new Date(user.createdAt).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          })}
        </p>

        {user.avatarUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline mt-2 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove photo
          </button>
        )}
        {errorMsg && <p className="text-xs text-rose-500 font-semibold">{errorMsg}</p>}
      </div>
    </div>
  );
}
