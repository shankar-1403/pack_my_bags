import { NextResponse } from "next/server";
import { isAuthed } from "./auth";

export async function denyIfGuest() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Sign in to change the site." }, { status: 401 });
  }
  return null;
}

export function fail(error: unknown) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return NextResponse.json({ error: message }, { status: 400 });
}
