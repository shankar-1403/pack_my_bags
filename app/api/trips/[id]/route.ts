import { NextResponse } from "next/server";
import { getTrips, saveTrips } from "@/lib/content";
import { denyIfGuest, fail } from "@/lib/guard";
import { cleanTrip } from "@/lib/validate";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const trips = getTrips();
    if (!trips.some((trip) => trip.id === id)) {
      return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    }
    const item = cleanTrip(await request.json(), id, trips);
    saveTrips(trips.map((trip) => (trip.id === id ? item : trip)));
    return NextResponse.json({ item });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  const { id } = await context.params;
  saveTrips(getTrips().filter((trip) => trip.id !== id));
  return NextResponse.json({ ok: true });
}
