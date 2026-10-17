import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../components/Alert";
import { ApiError, apiFetch, type Doctor } from "../lib/api";

export function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ specialties: string[] }>("/api/doctors/specialties")
      .then((d) => setSpecialties(d.specialties))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const query = specialty ? `?specialty=${encodeURIComponent(specialty)}` : "";
    apiFetch<{ doctors: Doctor[] }>(`/api/doctors${query}`)
      .then((d) => setDoctors(d.doctors))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load doctors")
      )
      .finally(() => setLoading(false));
  }, [specialty]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Our doctors</h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse specialists and book an available time slot.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <label htmlFor="specialty" className="block text-sm font-medium text-slate-700">
            Filter by specialty
          </label>
          <select
            id="specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-clinic-500 focus:outline-none focus:ring-1 focus:ring-clinic-500"
          >
            <option value="">All specialties</option>
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-clinic-600 border-t-transparent" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-600">No doctors match this filter.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <h2 className="font-semibold text-slate-900">{doc.name}</h2>
              <p className="mt-1 text-sm text-clinic-700">{doc.specialty}</p>
              <Link
                to={`/doctors/${doc.id}/book`}
                className="mt-4 inline-flex items-center justify-center rounded-md bg-clinic-600 px-3 py-2 text-sm font-medium text-white hover:bg-clinic-700"
              >
                View availability
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
