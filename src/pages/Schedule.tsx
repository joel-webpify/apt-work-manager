import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageShell";
import ScheduleView from "@/components/schedule/ScheduleView";
import { getJobs, updateJob, useJobs } from "@/lib/jobsStore";
import type { Job } from "@/data/mockData";

export default function Schedule() {
  const [jobs] = useJobs();
  const navigate = useNavigate();

  const handleUpdate = (jobId: string, updater: (j: Job) => Job) => {
    const current = getJobs().find((j) => j.id === jobId);
    if (!current) return;
    updateJob(jobId, updater(current));
  };

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <PageHeader
        title="Schedule"
        description="Who's doing what, week and day — across every pipeline"
      />
      <ScheduleView
        jobs={jobs}
        onUpdateJob={handleUpdate}
        onSelectJob={(j) => navigate(`/pipeline?job=${j.id}`)}
      />
    </div>
  );
}
