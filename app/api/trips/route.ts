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
    const trips = await getTrips();
    // { duplicateOf: id } copies a trip as an unpublished draft placed right after the original.
    if (body?.duplicateOf) {
      const index = trips.findIndex((trip) => trip.id === body.duplicateOf);
      if (index < 0) return NextResponse.json({ error: "Trip not found." }, { status: 404 });
      const source = trips[index];
      const item = cleanTrip({ ...source, title: `${source.title} (copy)`, slug: `${source.slug}-copy`, published: false, featured: false }, randomUUID(), trips);
      trips.splice(index + 1, 0, item);
      await saveTrips(trips);
      return NextResponse.json({ item });
    }
    const item = cleanTrip(body, randomUUID(), trips);
    trips.unshift(item);
    await saveTrips(trips);
    return NextResponse.json({ item });
  } catch (error) {
    return fail(error);
  }
}
