import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert } from "../components/Alert";
import { ApiError, apiFetch } from "../lib/api";

type Availability = {
  doctor: { id: string; name: string; specialty: string };
  timezone: string;
  slots: string[];
};

function formatSlot(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function slotDateKey(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function BookAppointmentPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!doctorId) return;
    setLoading(true);
    apiFetch<Availability>(`/api/doctors/${doctorId}/availability`)
      .then(setData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load slots")
      )
      .finally(() => setLoading(false));
  }, [doctorId]);

  const dates = useMemo(() => {
    if (!data) return [];
    const set = new Set(
      data.slots.map((s) => slotDateKey(s, data.timezone))
    );
    return Array.from(set).sort();
  }, [data]);

  const filteredSlots = useMemo(() => {
    if (!data) return [];
    if (!dateFilter) return data.slots;
    return data.slots.filter(
      (s) => slotDateKey(s, data.timezone) === dateFilter
    );
  }, [data, dateFilter]);

  useEffect(() => {
    if (dates.length && !dateFilter) {
      setDateFilter(dates[0]);
    }
  }, [dates, dateFilter]);

  async function book() {
    if (!selected || !doctorId) return;
    setBooking(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify({ doctorId, slot: selected }),
      });
      setSuccess("Appointment requested. It will appear as pending until confirmed.");
      setTimeout(() => navigate("/appointments"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Booking failed");
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-clinic-600 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <Alert variant="error">{error ?? "Doctor not found"}</Alert>
    );
  }

  return (
    <div>
      <Link to="/doctors" className="text-sm font-medium text-clinic-700 hover:underline">
        ← Back to doctors
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">Book appointment</h1>
      <p className="mt-1 text-slate-600">
        {data.doctor.name} · {data.doctor.specialty}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Times shown in {data.timezone.replace(/_/g, " ")}
      </p>

      <div className="mt-6 space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {dates.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            No upcoming slots available for this doctor.
          </div>
        ) : (
          <>
            <div className="max-w-xs">
              <label htmlFor="date" className="block text-sm font-medium text-slate-700">
                Date
              </label>
              <select
                id="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setSelected(null);
                }}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {dates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelected(slot)}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    selected === slot
                      ? "border-clinic-600 bg-clinic-50 text-clinic-800"
                      : "border-slate-200 bg-white hover:border-clinic-400"
                  }`}
                >
                  {formatSlot(slot, data.timezone)}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={!selected || booking}
              onClick={book}
              className="rounded-md bg-clinic-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-clinic-700 disabled:opacity-50"
            >
              {booking ? "Booking…" : "Confirm booking"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
