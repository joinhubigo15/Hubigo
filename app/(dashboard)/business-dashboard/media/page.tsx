"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/app/lib/auth-context";
import { getDashboardProfile, uploadDashboardGallery, deleteDashboardMedia, type DashboardMedia } from "@/app/lib/business-dashboard-api";

const MAX_GALLERY_IMAGES = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function BusinessMediaPage() {
  const { accessToken } = useAuth();
  const [media, setMedia] = useState<DashboardMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const atCapacity = media.length >= MAX_GALLERY_IMAGES;

  useEffect(() => {
    if (!accessToken) return;
    getDashboardProfile(accessToken)
      .then((p) => setMedia(p.media))
      .catch(() => setMedia([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !accessToken) return;
    setUploadError("");

    const list = Array.from(files);
    if (media.length + list.length > MAX_GALLERY_IMAGES) {
      setUploadError(`Gallery is limited to ${MAX_GALLERY_IMAGES} photos — you have ${media.length} already.`);
      return;
    }
    const invalidType = list.find((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalidType) {
      setUploadError(`${invalidType.name} isn't a supported format. Use JPG, PNG or WEBP.`);
      return;
    }
    const tooLarge = list.find((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (tooLarge) {
      setUploadError(`${tooLarge.name} is over 5MB. Please upload a smaller file.`);
      return;
    }

    setUploading(true);
    try {
      const updated = await uploadDashboardGallery(accessToken, list);
      setMedia(updated);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    await deleteDashboardMedia(accessToken, id);
    setMedia((prev) => prev.filter((m) => m.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col font-sans flex-1 min-h-[calc(100vh-64px)] bg-white w-full">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200/90 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-none">
              Media Asset Library
            </span>
            <span className="text-[10px] font-bold text-slate-400">{media.length} / {MAX_GALLERY_IMAGES} Photos</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Media Gallery & Image Manager</h1>
          <p className="text-xs text-slate-500 font-semibold">Upload photos customers see on your listing.</p>
        </div>

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || atCapacity}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-none shadow-none flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4" />
          <span>{uploading ? "Uploading..." : atCapacity ? "Limit Reached" : "Upload Photos"}</span>
        </button>
      </div>

      {uploadError && (
        <div className="px-4 py-2.5 rounded-none bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-semibold relative z-10 ">{uploadError}</div>
      )}

      {/* Drag & Drop Upload Zone */}
      {atCapacity ? (
        <div className="border-b border-slate-200/90 border-dashed border-slate-200 bg-slate-50 rounded-none p-8 text-center space-y-3 relative z-10 ">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-none">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-500">Gallery Full ({MAX_GALLERY_IMAGES}/{MAX_GALLERY_IMAGES})</h3>
            <p className="text-xs text-slate-400 font-medium">Delete a photo below to upload a new one.</p>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
          className="border-b border-slate-200/90 border-dashed border-purple-200 bg-purple-50/50 rounded-none p-8 text-center space-y-3 hover:bg-purple-50 transition-colors cursor-pointer relative z-10 "
        >
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-none">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Drag & Drop Photos Here</h3>
            <p className="text-xs text-slate-500 font-medium">
              Supports JPG, PNG & WEBP up to 5MB each · {MAX_GALLERY_IMAGES - media.length} of {MAX_GALLERY_IMAGES} remaining
            </p>
          </div>
        </div>
      )}

      {/* Media Grid */}
      {media.length === 0 ? (
        <p className="text-xs text-slate-500 font-semibold text-center py-6">No photos uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 relative z-10">
          {media.map((m) => (
            <div key={m.id} className="h-44 rounded-none overflow-hidden relative border border-slate-200 shadow-none group bg-slate-100 -mt-[1px] -ml-[1px] lg:mt-0 lg:ml-0">
              {m.url && <img src={m.url} alt={m.caption ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => handleDelete(m.id)} className="p-2 bg-rose-600 text-white rounded-none hover:bg-rose-700 shadow-none transition-colors cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
