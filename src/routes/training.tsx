import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Section, Stat, WallBody, WallHeader } from "@/components/boss/Wall";
import { EnterpriseTable, type Column } from "@/components/boss/EnterpriseTable";
import { Toolbar } from "@/components/boss/Toolbar";
import { ExportMenu } from "@/components/boss/ExportMenu";
import { StatusBadge } from "@/components/boss/StatusBadge";
import { pct } from "@/lib/module-ui";
import {
  useCourses,
  useTrainingProgress,
  type CourseRow,
  type ProgressRow,
} from "@/lib/modules-hooks";

export const Route = createFileRoute("/training")({
  head: () => ({
    meta: [
      { title: "Training & Certification · Boss Panel" },
      {
        name: "description",
        content:
          "Franchise training catalog with enrollment, completion rates, average scores and certification tracking.",
      },
      { property: "og:title", content: "Training & Certification · Boss Panel" },
      {
        property: "og:description",
        content: "Course catalog and franchise learner progress with certification status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrainingWall,
});

function TrainingWall() {
  const { data: courses = [], isLoading, error } = useCourses();
  const { data: progress = [], isLoading: loadingProgress, error: progressError } = useTrainingProgress();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return courses.filter((c) => !q || c.title.toLowerCase().includes(q) || c.kind.toLowerCase().includes(q));
  }, [courses, search]);

  const enrolled = courses.reduce((a, c) => a + c.enrolled, 0);
  const completed = courses.reduce((a, c) => a + c.completed, 0);
  const avgScore = courses.length
    ? (courses.reduce((a, c) => a + c.avgScore, 0) / courses.length).toFixed(1)
    : null;
  const certificates = progress.reduce((a, p) => a + p.certificates, 0);

  const columns: Column<CourseRow>[] = [
    {
      id: "title",
      header: "Course",
      cell: (c) => (
        <div>
          <div className="font-medium text-foreground">{c.title}</div>
          <div className="text-[11.5px] capitalize text-muted-foreground">
            {c.kind} · {c.durationMins} min
          </div>
        </div>
      ),
    },
    { id: "enrolled", header: "Enrolled", cell: (c) => <span className="tabular-nums">{c.enrolled}</span> },
    { id: "completed", header: "Completed", cell: (c) => <span className="tabular-nums">{c.completed}</span> },
    {
      id: "rate",
      header: "Completion",
      cell: (c) => <span className="tabular-nums text-muted-foreground">{pct(c.completed, c.enrolled)}</span>,
    },
    { id: "avgScore", header: "Avg Score", cell: (c) => <span className="tabular-nums">{c.avgScore}</span> },
    {
      id: "certificate",
      header: "Certificate",
      cell: (c) => <StatusBadge status={c.certificate ? "active" : "draft"} />,
    },
    { id: "status", header: "Status", cell: (c) => <StatusBadge status={c.status} /> },
  ];

  const progressColumns: Column<ProgressRow>[] = [
    { id: "member", header: "Learner", cell: (p) => <span className="font-medium text-foreground">{p.member}</span> },
    { id: "franchise", header: "Franchise", cell: (p) => p.franchise },
    {
      id: "coursesCompleted",
      header: "Courses Completed",
      cell: (p) => <span className="tabular-nums">{p.coursesCompleted}</span>,
    },
    { id: "score", header: "Score", cell: (p) => <span className="tabular-nums">{p.score}</span> },
    { id: "certificates", header: "Certificates", cell: (p) => <span className="tabular-nums">{p.certificates}</span> },
  ];

  return (
    <>
      <WallHeader
        eyebrow="Training"
        title="Training & Certification"
        description="Course catalog, franchise learner progress, scores and certification issuance."
      />
      <WallBody>
        <div className="wall-grid">
          <Stat
            label="Courses"
            value={courses.length || undefined}
            loading={isLoading}
            error={error ? "Failed to load" : null}
          />
          <Stat label="Enrollments" value={enrolled || undefined} tone="info" />
          <Stat label="Completion Rate" value={enrolled ? pct(completed, enrolled) : undefined} tone="success" />
          <Stat label="Avg Score" value={avgScore ?? undefined} />
          <Stat label="Certificates Issued" value={certificates || undefined} tone="success" loading={loadingProgress} />
          <Stat label="Learners" value={progress.length || undefined} />
        </div>

        <Section title="Course Catalog">
          <div className="space-y-3">
            <Toolbar
              search={search}
              onSearch={setSearch}
              searchPlaceholder="Search course or type…"
              right={
                <ExportMenu<CourseRow>
                  filename="franchise-training-courses"
                  rows={filtered}
                  sheetName="Courses"
                  permission="franchise.read"
                />
              }
            />
            <EnterpriseTable<CourseRow>
              columns={columns}
              rows={filtered}
              loading={isLoading}
              error={error ? "Failed to load courses" : null}
              selectable={false}
              emptyTitle="No courses"
              emptyDescription="Published training modules appear here with completion metrics."
            />
          </div>
        </Section>

        <Section title="Learner Progress" description="Per-member scores and certifications">
          <EnterpriseTable<ProgressRow>
            columns={progressColumns}
            rows={progress}
            loading={loadingProgress}
            error={progressError ? "Failed to load learner progress" : null}
            selectable={false}
            emptyTitle="No learner activity"
            emptyDescription="Progress appears here once franchise members start courses."
          />
        </Section>
      </WallBody>
    </>
  );
}
