import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Camera, HardHat, PoundSterling, Clock, CheckCircle2, Star } from "lucide-react";
import { employees } from "@/data/mockData";
import { useJobs } from "@/lib/jobsStore";
import { formatMinutes, timeOnSiteMinutes, useFieldRecords, useFieldUser } from "@/lib/fieldStore";

function startOfWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday first
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function MyStats() {
  const [jobs] = useJobs();
  const [userId] = useFieldUser();
  const all = useFieldRecords();
  const me = employees.find((e) => e.id === userId) ?? employees[0];

  const mine = useMemo(() => {
    const week = startOfWeek().getTime();
    return Object.entries(all)
      .map(([key, record]) => {
        const [jobId, employeeId] = key.split("::");
        return { jobId, employeeId, record };
      })
      .filter((r) => r.employeeId === userId)
      .filter((r) => {
        const when = r.record.stamps.finished ?? r.record.stamps.arrived ?? r.record.updatedAt;
        return when ? new Date(when).getTime() >= week : false;
      });
  }, [all, userId]);

  const done = mine.filter((r) => r.record.outcome === "completed" || r.record.status === "finished").length;
  const minutes = mine.reduce((sum, r) => sum + (timeOnSiteMinutes(r.record) ?? 0), 0);
  const photos = mine.reduce((sum, r) => sum + r.record.photos.length, 0);
  const extras = mine.filter((r) => r.record.extraWorkNote.trim());
  const extraValue = extras.reduce((sum, r) => sum + (Number(r.record.extraWorkValue) || 0), 0);
  const paid = mine.reduce((sum, r) => sum + (r.record.payment?.amount ?? 0), 0);
  const reviews = mine.filter((r) => r.record.reviewRequestedAt).length;

  return (
    <div className="flex-1 p-4 space-y-4">
      <div>
        <h1 className="text-lg font-semibold leading-tight">Your week</h1>
        <p className="text-xs text-muted-foreground">
          Since Monday, {me.name.split(" ")[0]}. This doubles as your timesheet.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Tile icon={<CheckCircle2 className="w-4 h-4" />} label="Jobs finished" value={String(done)} />
        <Tile icon={<Clock className="w-4 h-4" />} label="Time on site" value={formatMinutes(minutes)} />
        <Tile icon={<PoundSterling className="w-4 h-4" />} label="Taken on the day" value={`£${paid.toFixed(0)}`} />
        <Tile icon={<Camera className="w-4 h-4" />} label="Photos taken" value={String(photos)} />
        <Tile icon={<HardHat className="w-4 h-4" />} label="Extra work spotted" value={String(extras.length)} />
        <Tile icon={<Star className="w-4 h-4" />} label="Reviews asked for" value={String(reviews)} />
      </div>

      <div className="rounded-xl border-hairline p-3.5">
        <h2 className="text-sm font-semibold">Work you've found for the business</h2>
        {extras.length === 0 ? (
          <p className="text-xs text-muted-foreground mt-1">
            Nothing yet this week. Anything you spot on site goes straight to the office as a quote.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mt-1">
              Roughly £{extraValue.toFixed(0)} of possible work, from {extras.length}{" "}
              {extras.length === 1 ? "visit" : "visits"}.
            </p>
            <ul className="mt-2 space-y-2">
              {extras.map((r) => {
                const job = jobs.find((j) => j.id === r.jobId);
                return (
                  <li key={r.jobId} className="text-sm">
                    <Link to={`/field/job/${r.jobId}`} className="font-medium hover:underline">
                      {job?.customer ?? r.jobId}
                    </Link>
                    <p className="text-xs text-muted-foreground">{r.record.extraWorkNote}</p>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border-hairline p-3">
      <div className="text-muted-foreground">{icon}</div>
      <div className="text-xl font-semibold mt-1.5 tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
