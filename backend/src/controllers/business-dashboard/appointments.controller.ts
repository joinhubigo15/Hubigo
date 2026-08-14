import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import * as appointmentsService from "../../services/business-dashboard/appointments.service";
import { createAppointmentSchema, updateAppointmentSchema } from "../../schemas/business-dashboard.schema";

export const getAppointments = asyncHandler(async (req: Request, res: Response) => {
  const appointments = await appointmentsService.listAppointments(req.business!.id);
  return sendSuccess(res, 200, "Appointments", appointments);
});

export const postAppointment = asyncHandler(async (req: Request, res: Response) => {
  const input = createAppointmentSchema.parse(req.body);
  const appointment = await appointmentsService.createAppointment(req.business!.id, input);
  return sendSuccess(res, 201, "Appointment created", appointment);
});

export const patchAppointment = asyncHandler(async (req: Request, res: Response) => {
  const input = updateAppointmentSchema.parse(req.body);
  const appointment = await appointmentsService.updateAppointment(req.business!.id, req.params.appointmentId, input);
  return sendSuccess(res, 200, "Appointment updated", appointment);
});

export const deleteAppointmentHandler = asyncHandler(async (req: Request, res: Response) => {
  await appointmentsService.deleteAppointment(req.business!.id, req.params.appointmentId);
  return sendSuccess(res, 200, "Appointment removed", null);
});
