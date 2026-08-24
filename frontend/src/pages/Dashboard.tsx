import { FileSearch } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import type { BadgeTone } from "../components/ui/Badge";

const GETTING_STARTED_STEPS = [
  {
    number: "01",
    title: "Add a job description",
    description: "Paste or upload the role you're hiring for. Required and preferred requirements are kept separate."
  },
  {
    number: "02",
    title: "Upload candidate resumes",
    description: "PDF or text resumes for as many candidates as you want to compare against the role."
  },
  {
    number: "03",
    title: "Review ranked, explained results",
    description: "Every match is backed by evidence pulled from the resume - not just a score."
  }
];

const RELATIONSHIP_LEGEND: Array<{ label: string; tone: BadgeTone; description: string }> = [
  { label: "Exact match", tone: "success", description: "The requirement is directly demonstrated." },
  { label: "Semantic match", tone: "accent", description: "Different wording, equivalent capability." },
  { label: "Related, not equivalent", tone: "warning", description: "Adjacent skill - doesn't satisfy the requirement." },
  { label: "No evidence", tone: "danger", description: "Nothing in the resume supports this requirement." }
];

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A snapshot of screening activity across your open roles."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open roles" value="0" hint="Add a job description to get started" />
        <StatCard label="Candidates screened" value="0" hint="No screenings run yet" />
        <StatCard label="Shortlisted" value="0" hint="Awaiting first screening" tone="success" />
        <StatCard label="Mandatory-gap holds" value="0" hint="Required skills not yet evaluated" tone="warning" />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Get started</CardTitle>
          </CardHeader>
          <CardBody>
            <ol className="flex flex-col gap-5">
              {GETTING_STARTED_STEPS.map((step) => (
                <li key={step.number} className="flex gap-4">
                  <span className="font-mono text-xs text-slate-soft">{step.number}</span>
                  <div>
                    <p className="text-sm font-medium text-ink">{step.title}</p>
                    <p className="mt-0.5 text-sm text-slate">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>How matching works</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-slate">
              Every requirement is classified against the resume, never assumed:
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {RELATIONSHIP_LEGEND.map((item) => (
                <li key={item.label} className="flex flex-col gap-1">
                  <Badge tone={item.tone}>{item.label}</Badge>
                  <p className="text-xs text-slate">{item.description}</p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Recent screenings</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <FileSearch size={28} strokeWidth={1.5} className="text-slate-soft" />
              <p className="text-sm font-medium text-ink">No screenings yet</p>
              <p className="max-w-sm text-sm text-slate">
                Once resume upload and screening are connected, your most recent runs will show up
                here, ranked by score.
              </p>
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
