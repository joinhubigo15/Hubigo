import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { writeAdminAudit, adminAuditReqMeta } from "../../lib/admin-audit";
import { createImportJob, listImportJobs, retryImportJob, runImportJob } from "../../services/admin/import-job.service";
import { createImportJobSchema } from "../../schemas/admin.schema";

export const postImportJob = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("A CSV file is required (field name: file)");
  const { sector } = createImportJobSchema.parse(req.body);

  const job = await createImportJob(req.file, sector, req.adminAuth!.id);
  await writeAdminAudit(req.adminAuth!.id, "import_job_started", "ImportJob", job.id, adminAuditReqMeta(req), {
    filename: job.filename,
    sector,
  });

  // Fire-and-forget — the request responds immediately with the created job row while
  // processing continues in the background; GET /imports is polled for progress.
  runImportJob(job.id).catch((err) => console.error(`Import job ${job.id} crashed:`, err));

  return sendSuccess(res, 201, "Import job started", job);
});

export const getImportJobs = asyncHandler(async (_req: Request, res: Response) => {
  const jobs = await listImportJobs();
  return sendSuccess(res, 200, "Import jobs", jobs);
});

export const postRetryImportJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await retryImportJob(req.params.id);
  await writeAdminAudit(req.adminAuth!.id, "import_job_retried", "ImportJob", req.params.id, adminAuditReqMeta(req));

  runImportJob(job.id).catch((err) => console.error(`Import job ${job.id} crashed:`, err));

  return sendSuccess(res, 200, "Import job retrying", job);
});
