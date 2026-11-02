import { notFound } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { Gate } from "@/components/gate";
const sections: Record<string, [string, number]> = {
  learning: ["My Learning", 2],
  practice: ["Practice", 2],
  tests: ["Mock Tests", 2],
  doubts: ["Doubt Hub", 3],
  communities: ["Study Communities", 3],
  rooms: ["Study Rooms", 4],
  resources: ["Resources", 2],
  planner: ["Planner", 5],
  analytics: ["Analytics", 5],
  messages: ["Messages", 4],
  notifications: ["Notifications", 3],
};
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const data = sections[section];
  if (!data) notFound();
  return (
    <Shell>
      <Gate>
        <section className="card empty">
          <span className="eyebrow">MILESTONE {data[1]}</span>
          <h1>{data[0]}</h1>
          <p>This feature is planned and has not been implemented yet.</p>
          <Link href="/dashboard" className="button">
            Return to your dashboard
          </Link>
        </section>
      </Gate>
    </Shell>
  );
}
