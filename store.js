import {
  STORAGE_KEY,
  SETTINGS_KEY,
  emptyIssue,
  seedToday,
  todayISO,
} from "./schema.js";

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function ensureSeed() {
  const all = readAll();
  const today = todayISO();
  if (!all[today]) {
    const seed = seedToday();
    all[seed.id] = seed;
    writeAll(all);
  }
  return all;
}

export function getIssue(id) {
  const all = ensureSeed();
  return all[id] || null;
}

export function getPublishedToday() {
  const all = ensureSeed();
  const today = todayISO();
  const issue = all[today];
  if (issue && issue.status === "published") return issue;
  const published = Object.values(all)
    .filter((i) => i.status === "published")
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return published[0] || null;
}

export function listPublished() {
  const all = ensureSeed();
  return Object.values(all)
    .filter((i) => i.status === "published")
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function listAll() {
  const all = ensureSeed();
  return Object.values(all).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function saveIssue(issue) {
  const all = readAll();
  const next = {
    ...issue,
    id: issue.date,
    updatedAt: new Date().toISOString(),
  };
  all[next.id] = next;
  writeAll(all);
  return next;
}

export function publishIssue(issue) {
  return saveIssue({
    ...issue,
    status: "published",
    publishedAt: new Date().toISOString(),
  });
}

export function getOrCreateDraft(date = todayISO()) {
  const all = ensureSeed();
  if (all[date]) return { ...all[date] };
  return emptyIssue(date);
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { adminPin: "1234", shopeeNote: "" };
    return { adminPin: "1234", shopeeNote: "", ...JSON.parse(raw) };
  } catch {
    return { adminPin: "1234", shopeeNote: "" };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
