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
    const trips = await getTrips();
    if (!trips.some((trip) => trip.id === id)) {
      return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    }
    const item = cleanTrip(await request.json(), id, trips);
    await saveTrips(trips.map((trip) => (trip.id === id ? item : trip)));
    return NextResponse.json({ item });
  } catch (error) {
    return fail(error);
  }
}

/** Quick actions from the trip list: publish/unpublish, feature/unfeature, move up/down. */
export async function PATCH(request: Request, context: Context) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { published?: boolean; featured?: boolean; move?: "up" | "down" | "top" };
    const trips = await getTrips();
    const index = trips.findIndex((trip) => trip.id === id);
    if (index < 0) return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    const trip = { ...trips[index], updatedAt: new Date().toISOString() };
    if (typeof body.published === "boolean") trip.published = body.published;
    if (typeof body.featured === "boolean") trip.featured = body.featured;
    trips[index] = trip;
    if (body.move) {
      const [item] = trips.splice(index, 1);
      const to = body.move === "top" ? 0 : Math.min(trips.length, Math.max(0, index + (body.move === "up" ? -1 : 1)));
      trips.splice(to, 0, item);
    }
    await saveTrips(trips);
    return NextResponse.json({ item: trip });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  const { id } = await context.params;
  await saveTrips((await getTrips()).filter((trip) => trip.id !== id));
  return NextResponse.json({ ok: true });
}
