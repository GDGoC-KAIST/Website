import {FieldValue} from "firebase-admin/firestore";

export function toFirestorePatch(obj: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value === null) {
      out[key] = FieldValue.delete();
    } else {
      out[key] = value;
    }
  }
  return out;
}
