import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getTrips, saveTrips } from "@/lib/content";
import { denyIfGuest, fail } from "@/lib/guard";
import { cleanTrip } from "@/lib/validate";

export async function POST(request: Request) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  try {
    const body = await request.json();
    const trips = getTrips();
    const item = cleanTrip(body, randomUUID(), trips);
    trips.unshift(item);
    saveTrips(trips);
    return NextResponse.json({ item });
  } catch (error) {
    return fail(error);
  }
}
