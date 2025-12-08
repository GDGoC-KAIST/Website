import type {Request, Response} from "express";
import {getFirestore} from "firebase-admin/firestore";

export async function getHourlyTraffic(req: Request, res: Response): Promise<void> {
  const {date} = req.query as {date?: string};
  const resolvedDate = date === "today" ? new Date().toISOString().slice(0, 10) : date;
  if (!resolvedDate) {
    res.status(400).json({error: "date (YYYY-MM-DD) is required"});
    return;
  }

  const db = getFirestore();
  const hoursSnap = await db.collection("opsHourlyAgg").doc(resolvedDate).collection("hours").get();
  const payload = Array.from({length: 24}).map((_, idx) => ({hour: idx.toString().padStart(2, "0"), requestsTotal: 0}));

  hoursSnap.forEach((doc) => {
    const data = doc.data() as Record<string, unknown>;
    const hour = doc.id;
    const index = Number.parseInt(hour, 10);
    if (!Number.isNaN(index) && index >= 0 && index < 24) {
      payload[index] = {
        hour,
        ...data,
        requestsTotal: Number(data.requestsTotal ?? 0),
      } as {hour: string; requestsTotal: number};
    }
  });

  res.status(200).json({date: resolvedDate, hours: payload});
}

export async function getDailyTraffic(req: Request, res: Response): Promise<void> {
  const daysRaw = req.query.days as string | undefined;
  const days = daysRaw ? Number.parseInt(daysRaw, 10) : 7;
  if (Number.isNaN(days) || days <= 0) {
    res.status(400).json({error: "days must be a positive integer"});
    return;
  }

  const db = getFirestore();
  const dailyAgg = db.collection("opsDailyAgg");
  const fetchLatest = async () => {
    const snap = await dailyAgg.orderBy("__name__").limitToLast(days).get();
    const docs = snap.docs.slice().reverse();
    return docs.map((doc) => ({date: doc.id, ...doc.data()}));
  };

  try {
    const results = await fetchLatest();
    res.status(200).json(results);
  } catch (error) {
    // Emulator sometimes rejects stale descending key scans; retry ascending without limit.
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("descending key scans")) {
      const snap = await dailyAgg.orderBy("__name__").get();
      const docs = snap.docs.slice(-days).reverse();
      res.status(200).json(docs.map((doc) => ({date: doc.id, ...doc.data()})));
      return;
    }
    throw error;
  }
}
