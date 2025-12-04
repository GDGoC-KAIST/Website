import {Timestamp} from "firebase-admin/firestore";
import {db} from "../config/firebase";
import {RecruitConfig} from "../types/recruit";

const COLLECTION = "recruitConfig";
const DOC_ID = "current";

const defaultConfig: RecruitConfig = {
  isOpen: false,
  openAt: Timestamp.fromMillis(Date.now()),
  closeAt: Timestamp.fromMillis(Date.now()),
  messageWhenClosed: "Recruiting is currently closed.",
  semester: "",
};

function normalizeConfig(data?: FirebaseFirestore.DocumentData | RecruitConfig | null): RecruitConfig {
  if (!data) {
    return {...defaultConfig};
  }
  return {
    ...defaultConfig,
    ...(data as RecruitConfig),
  };
}

export async function readRecruitConfig(): Promise<RecruitConfig> {
  const docRef = db.collection(COLLECTION).doc(DOC_ID);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    await docRef.set(defaultConfig);
    return {...defaultConfig};
  }
  return normalizeConfig(snapshot.data() as RecruitConfig);
}

export function serializeRecruitConfig(config: RecruitConfig) {
  return {
    isOpen: config.isOpen,
    openAt: config.openAt.toDate().toISOString(),
    closeAt: config.closeAt.toDate().toISOString(),
    messageWhenClosed: config.messageWhenClosed,
    semester: config.semester,
  };
}

function parseTimestamp(input?: string) {
  if (!input) return undefined;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }
  return Timestamp.fromDate(date);
}

export async function updateRecruitConfig(values: {
  isOpen?: boolean;
  openAt?: string;
  closeAt?: string;
  messageWhenClosed?: string;
  semester?: string;
}): Promise<RecruitConfig> {
  const docRef = db.collection(COLLECTION).doc(DOC_ID);
  const current = await readRecruitConfig();

  const nextOpenAt = values.openAt ? parseTimestamp(values.openAt) : undefined;
  const nextCloseAt = values.closeAt ? parseTimestamp(values.closeAt) : undefined;

  const next: RecruitConfig = {
    ...current,
    isOpen: values.isOpen ?? current.isOpen,
    messageWhenClosed: values.messageWhenClosed ?? current.messageWhenClosed,
    semester: values.semester ?? current.semester,
    openAt: nextOpenAt ?? current.openAt,
    closeAt: nextCloseAt ?? current.closeAt,
  };

  await docRef.set(next, {merge: true});
  return next;
}
