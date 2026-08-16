/**
 * DailyIssue schema — single source of truth for UI + AI.
 * AI may fill: problem, freeActions, product (without shopeeUrl).
 * Human-only: shopeeUrl, status, publish.
 */

export const STORAGE_KEY = "thangork_issues_v1";
export const SETTINGS_KEY = "thangork_settings_v1";

export function buildAiPrompt({ date, aqi, weather }) {
  return `บทบาท: บรรณาธิการโต๊ะแก้ปัญหาคนกรุงเทพ ภาษาไทยสั้น ตรง ไม่โวยวาย
วันที่: ${date}
ข้อมูลแวดล้อม: ฝุ่น AQI ${aqi ?? "ไม่ทราบ"}, อากาศ ${weather ?? "ไม่ทราบ"}

ส่งออกเป็น JSON เท่านั้น ตาม schema นี้ (ไม่มี markdown):
{
  "problem": { "title": string, "summary": string, "tags": string[] },
  "freeActions": string[],
  "product": null | { "name": string, "why": string, "priceHint": string }
}

กฎ:
- ปัญหาเดียวของวันนี้เท่านั้น
- freeActions ต้องทำได้โดยไม่ซื้อของ
- product มีได้ไม่เกิน 1 หรือเป็น null
- ห้ามใส่ลิงก์
- ห้ามขายของโวยวาย`;
}

export function emptyIssue(date = todayISO()) {
  return {
    id: date,
    date,
    status: "draft",
    problem: { title: "", summary: "", tags: [] },
    freeActions: ["", ""],
    product: null,
    sources: {},
    updatedAt: new Date().toISOString(),
  };
}

export function seedToday() {
  const date = todayISO();
  return {
    id: date,
    date,
    status: "published",
    problem: {
      title: "ฝุ่นสูง ห้องปิดทั้งวัน อากาศในบ้านอึดอัด",
      summary:
        "ช่วง AQI แย่ คนในคอนโดมักปิดหน้าต่างยาว ทำให้ห้องอับและฝุ่นสะสมจากทางเดิน/เสื้อผ้า",
      tags: ["ฝุ่น", "คอนโด", "อากาศ"],
    },
    freeActions: [
      "ปิดหน้าต่างฝั่งถนน เปิดฝั่งในถ้ามีลมผ่านโถง",
      "เช็ดพื้นเปียกวันละครั้ง ฝุ่นจะเกาะพื้นแทนการลอย",
      "ซักผ้าม่านหรือผ้าคลุมโซฟาถ้าไม่ได้ซักนาน — ดักฝุ่นได้มาก",
    ],
    product: {
      name: "เครื่องฟอกอากาศสำหรับห้อง 20–30 ตร.ม.",
      why: "ช่วยวนอากาศในห้องที่ปิดหน้าต่างยาว โดยเฉพาะตอนนอน",
      priceHint: "ประมาณ 1,500–4,000 บาท",
      shopeeUrl:
        "https://shopee.co.th/search?keyword=%E0%B9%80%E0%B8%84%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B8%9F%E0%B8%AD%E0%B8%81%E0%B8%AD%E0%B8%B2%E0%B8%81%E0%B8%B2%E0%B8%A8",
    },
    sources: { aqi: 165, weather: "ท้องฟ้ามัว" },
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function todayISO() {
  const d = new Date();
  const tz = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return tz.toISOString().slice(0, 10);
}

export function formatThaiDate(isoDate) {
  try {
    const [y, m, day] = isoDate.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, day, 5, 0, 0));
    return new Intl.DateTimeFormat("th-TH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Bangkok",
    }).format(dt);
  } catch {
    return isoDate;
  }
}

export function normalizeAiPayload(raw, date = todayISO()) {
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  const problem = data.problem || {};
  const freeActions = Array.isArray(data.freeActions)
    ? data.freeActions.map(String).filter(Boolean).slice(0, 5)
    : [];
  let product = null;
  if (data.product && typeof data.product === "object") {
    product = {
      name: String(data.product.name || "").trim(),
      why: String(data.product.why || "").trim(),
      priceHint: data.product.priceHint
        ? String(data.product.priceHint)
        : undefined,
      shopeeUrl: "",
    };
    if (!product.name) product = null;
  }
  return {
    id: date,
    date,
    status: "draft",
    problem: {
      title: String(problem.title || "").trim(),
      summary: String(problem.summary || "").trim(),
      tags: Array.isArray(problem.tags)
        ? problem.tags.map(String).slice(0, 6)
        : [],
    },
    freeActions: freeActions.length ? freeActions : [""],
    product,
    sources: data.sources || {},
    updatedAt: new Date().toISOString(),
  };
}
