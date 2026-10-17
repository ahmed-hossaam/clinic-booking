import { config } from "../config.js";

function getPartsInClinicTz(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: config.clinicTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
  };
}

/** Build UTC Date for a local clinic date/time */
export function clinicLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const parts = getPartsInClinicTz(guess);
  const targetMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const actualMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    0
  );
  return new Date(guess.getTime() + (targetMs - actualMs));
}

function addClinicDays(year: number, month: number, day: number, add: number) {
  const noon = clinicLocalToUtc(year, month, day, 12, 0);
  const next = new Date(noon.getTime() + add * 24 * 60 * 60 * 1000);
  return getPartsInClinicTz(next);
}

export function generateSlotCandidates(from: Date, days: number): Date[] {
  const slots: Date[] = [];
  const start = getPartsInClinicTz(from);

  for (let d = 0; d < days; d++) {
    const { year, month, day } =
      d === 0 ? start : addClinicDays(start.year, start.month, start.day, d);

    for (
      let hour = config.clinicOpenHour;
      hour < config.clinicCloseHour;
      hour++
    ) {
      for (
        let minute = 0;
        minute < 60;
        minute += config.slotIntervalMinutes
      ) {
        const slot = clinicLocalToUtc(year, month, day, hour, minute);
        if (slot.getTime() > from.getTime()) {
          slots.push(slot);
        }
      }
    }
  }

  const seen = new Set<string>();
  return slots
    .filter((s) => {
      const key = s.toISOString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.getTime() - b.getTime());
}

export function isSlotOnSchedule(slot: Date): boolean {
  const parts = getPartsInClinicTz(slot);
  if (
    parts.hour < config.clinicOpenHour ||
    parts.hour >= config.clinicCloseHour
  ) {
    return false;
  }
  if (parts.minute % config.slotIntervalMinutes !== 0) {
    return false;
  }
  return true;
}

export function isPastSlot(slot: Date): boolean {
  return slot.getTime() <= Date.now();
}
