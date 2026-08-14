import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import type { CreateAppointmentInput, UpdateAppointmentInput } from "../../schemas/business-dashboard.schema";

export function listAppointments(businessId: string) {
  return prisma.appointment.findMany({ where: { businessId }, orderBy: { scheduledAt: "desc" } });
}

export function createAppointment(businessId: string, input: CreateAppointmentInput) {
  return prisma.appointment.create({
    data: {
      businessId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      serviceName: input.serviceName,
      scheduledAt: input.scheduledAt,
      notes: input.notes,
    },
  });
}

export async function updateAppointment(businessId: string, appointmentId: string, input: UpdateAppointmentInput) {
  const existing = await prisma.appointment.findFirst({ where: { id: appointmentId, businessId } });
  if (!existing) throw ApiError.notFound("Appointment not found");
  return prisma.appointment.update({ where: { id: appointmentId }, data: input });
}

export async function deleteAppointment(businessId: string, appointmentId: string) {
  const existing = await prisma.appointment.findFirst({ where: { id: appointmentId, businessId } });
  if (!existing) throw ApiError.notFound("Appointment not found");
  await prisma.appointment.delete({ where: { id: appointmentId } });
}
