import { NextResponse } from "next/server";

export async function GET() {
  const popular = [
    "Hospitals in Bangalore",
    "Dentists in Bangalore",
    "Diagnostic Labs",
    "Pharmacies 24/7",
    "Physiotherapy Clinics",
    "Eye Clinics",
  ];
  return NextResponse.json({ success: true, data: popular });
}
