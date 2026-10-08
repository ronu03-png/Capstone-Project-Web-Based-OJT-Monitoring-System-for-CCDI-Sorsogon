"use client";

import { useRouter } from "next/navigation";

const TYPE_OPTIONS = [
  { value: "", label: "All Industries" },
  { value: "Government / Public Sector", label: "Government / Public Sector" },
  { value: "Information Technology", label: "Information Technology" },
  { value: "Construction", label: "Construction" },
  { value: "Education", label: "Education" },
  { value: "Banking and Finance", label: "Banking and Finance" },
  { value: "Telecommunications", label: "Telecommunications" },
  { value: "Business Services", label: "Business Services" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Retail", label: "Retail" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Media and Communications", label: "Media and Communications" },
  { value: "Security Services", label: "Security Services" },
  { value: "Other", label: "Other" },
];

const LOCATION_OPTIONS = [
  { value: "", label: "All Locations" },
  { value: "sorsogon", label: "Sorsogon City" },
  { value: "outside", label: "Outside Sorsogon" },
];

export function CompanyFilters({ type, location }: { type: string; location: string }) {
  const router = useRouter();

  function update(param: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(param, value);
    else params.delete(param);
    router.push(`/admin/companies?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={type}
        onChange={(e) => update("type", e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
      >
        {TYPE_OPTIONS.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <select
        value={location}
        onChange={(e) => update("location", e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
      >
        {LOCATION_OPTIONS.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>
      {(type || location) && (
        <button
          onClick={() => router.push("/admin/companies")}
          className="h-9 rounded-md border border-input px-3 text-sm text-muted-foreground hover:bg-muted"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
