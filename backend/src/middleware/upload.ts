import multer from "multer";
import { ApiError } from "../utils/ApiError";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(ApiError.badRequest("Only JPEG, PNG, or WEBP images are allowed"));
      return;
    }
    cb(null, true);
  },
}).single("avatar");

const MAX_BUSINESS_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const businessImageFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(ApiError.badRequest("Only JPEG, PNG, or WEBP images are allowed"));
    return;
  }
  cb(null, true);
};

/** Single business image (logo, cover, or one product photo). Field name "image". */
export const businessImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BUSINESS_IMAGE_SIZE_BYTES },
  fileFilter: businessImageFilter,
}).single("image");

/** Multiple gallery photos in one request. Field name "images", up to 10 per call. */
export const businessGalleryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BUSINESS_IMAGE_SIZE_BYTES },
  fileFilter: businessImageFilter,
}).array("images", 10);

const ALLOWED_CLAIM_DOCUMENT_MIME_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);
const MAX_CLAIM_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/** Single business-ownership proof document (GST certificate, trade license, etc). Field name
 * "document". JPG, PNG, and PDF are accepted. */
export const claimDocumentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CLAIM_DOCUMENT_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_CLAIM_DOCUMENT_MIME_TYPES.has(file.mimetype)) {
      cb(ApiError.badRequest("Only JPG, PNG, or PDF files are allowed"));
      return;
    }
    cb(null, true);
  },
}).single("document");

const ALLOWED_CSV_MIME_TYPES = new Set(["text/csv", "application/vnd.ms-excel"]);
const MAX_CSV_IMPORT_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

/** Single CSV file for admin bulk-import jobs. Field name "file". Buffer is written to disk
 * by the import-job service (the importer's CSV parser reads from a file path). */
export const csvImportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CSV_IMPORT_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_CSV_MIME_TYPES.has(file.mimetype)) {
      cb(ApiError.badRequest("Only CSV files are allowed"));
      return;
    }
    cb(null, true);
  },
}).single("file");
