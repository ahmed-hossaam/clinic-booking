const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  details?: Array<{ path: string; message: string }>;

  constructor(
    message: string,
    status: number,
    details?: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data = await parseJson<{
    error?: string;
    details?: Array<{ path: string; message: string }>;
  }>(res);

  if (!res.ok) {
    throw new ApiError(
      data.error ?? `Request failed (${res.status})`,
      res.status,
      data.details
    );
  }

  return data as T;
}

export type User = {
  id: string;
  name: string;
  email: string;
  role: "patient" | "admin";
  createdAt: string;
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  createdAt?: string;
};

export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export type PatientAppointment = {
  id: string;
  slot: string;
  status: AppointmentStatus;
  createdAt: string;
  doctor: Pick<Doctor, "id" | "name" | "specialty">;
};

export type AdminAppointment = {
  id: string;
  slot: string;
  status: AppointmentStatus;
  createdAt: string;
  patient: { id: string; name: string; email: string };
  doctor: Pick<Doctor, "id" | "name" | "specialty">;
};
