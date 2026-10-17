import { useCallback, useEffect, useState } from "react";
import { Alert } from "../components/Alert";
import { StatusBadge } from "../components/StatusBadge";
import { ApiError, apiFetch, type PatientAppointment } from "../lib/api";

function formatSlot(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<{ appointments: PatientAppointment[] }>("/api/appointments/mine")
      .then((d) => setAppointments(d.appointments))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function cancel(id: string) {
    if (!confirm("Cancel this appointment?")) return;
    setActionId(id);
    setError(null);
    try {
      await apiFetch(`/api/appointments/${id}/cancel`, { method: "POST" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Cancel failed");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">My appointments</h1>
      <p className="mt-1 text-sm text-slate-600">
        View and manage your scheduled visits.
      </p>

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
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-600">You have no appointments yet.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Specialty</th>
                <th className="px-4 py-3 font-medium">Date & time</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {a.doctor.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.doctor.specialty}</td>
                  <td className="px-4 py-3 text-slate-600">{formatSlot(a.slot)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3">
                    {a.status !== "cancelled" && (
                      <button
                        type="button"
                        disabled={actionId === a.id}
                        onClick={() => cancel(a.id)}
                        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {actionId === a.id ? "Cancelling…" : "Cancel"}
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
