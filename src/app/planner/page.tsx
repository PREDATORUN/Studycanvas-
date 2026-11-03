import { Shell } from "@/components/shell";
import { Gate } from "@/components/gate";
import { Planner } from "@/features/planner/planner";
export default function Page() {
  return (
    <Shell>
      <Gate>
        <Planner />
      </Gate>
    </Shell>
  );
}
