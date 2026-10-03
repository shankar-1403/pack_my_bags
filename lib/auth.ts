import { cookies } from "next/headers";
import { CMS_COOKIE, readSession } from "./cms-token";

export { CMS_COOKIE };

export async function isAuthed() {
  const jar = await cookies();
  return readSession(jar.get(CMS_COOKIE)?.value) !== null;
}
