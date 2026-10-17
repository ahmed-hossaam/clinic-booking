import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT ?? "3001", 10),
  databaseUrl: requireEnv("DATABASE_URL"),
  jwtSecret: requireEnv("JWT_SECRET"),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  clinicTimezone: process.env.CLINIC_TIMEZONE ?? "America/New_York",
  clinicOpenHour: parseInt(process.env.CLINIC_OPEN_HOUR ?? "9", 10),
  clinicCloseHour: parseInt(process.env.CLINIC_CLOSE_HOUR ?? "17", 10),
  slotIntervalMinutes: parseInt(process.env.SLOT_INTERVAL_MINUTES ?? "30", 10),
  daysAhead: parseInt(process.env.DAYS_AHEAD ?? "14", 10),
  cookieName: "clinic_token",
  isProduction: process.env.NODE_ENV === "production",
};
