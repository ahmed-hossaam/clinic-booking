import { useCallback, useEffect, useState } from "react";
import { Alert } from "../components/Alert";
import { StatusBadge } from "../components/StatusBadge";
import {
  ApiError,
  apiFetch,
  type AdminAppointment,
  type AppointmentStatus,
} from "../lib/api";

function formatSlot(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function AdminDashboardPage() {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [status, setStatus] = useState<"" | AppointmentStatus>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const q = status ? `?status=${status}` : "";
    apiFetch<{ appointments: AdminAppointment[] }>(
      `/api/admin/appointments${q}`
    )
      .then((d) => setAppointments(d.appointments))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirm(id: string) {
    setActionId(id);
    try {
      await apiFetch(`/api/admin/appointments/${id}/confirm`, {
        method: "POST",
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Confirm failed");
    } finally {
      setActionId(null);
    }
  }

  async function cancel(id: string) {
    if (!confirm("Cancel this appointment?")) return;
    setActionId(id);
    try {
      await apiFetch(`/api/admin/appointments/${id}/cancel`, {
        method: "POST",
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Cancel failed");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Admin dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">
        Manage all clinic appointments.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div className="w-full sm:w-48">
          <label htmlFor="status" className="block text-sm font-medium text-slate-700">
            Filter by status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "" | AppointmentStatus)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-clinic-600 border-t-transparent" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
          No appointments found.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{a.patient.name}</div>
                    <div className="text-xs text-slate-500">{a.patient.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{a.doctor.name}</div>
                    <div className="text-xs text-slate-500">{a.doctor.specialty}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatSlot(a.slot)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3 space-x-3">
                    {a.status === "pending" && (
                      <button
                        type="button"
                        disabled={actionId === a.id}
                        onClick={() => confirm(a.id)}
                        className="text-sm font-medium text-clinic-700 hover:underline disabled:opacity-50"
                      >
                        Confirm
                      </button>
                    )}
                    {a.status !== "cancelled" && (
                      <button
                        type="button"
                        disabled={actionId === a.id}
                        onClick={() => cancel(a.id)}
                        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
