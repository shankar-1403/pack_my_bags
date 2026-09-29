import { cookies } from "next/headers";
import { CMS_COOKIE, cmsToken } from "./cms-token";

export { CMS_COOKIE };

export async function isAuthed() {
  const jar = await cookies();
  return jar.get(CMS_COOKIE)?.value === cmsToken();
}
