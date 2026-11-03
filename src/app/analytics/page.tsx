import { Shell } from "@/components/shell";
import { Gate } from "@/components/gate";
import { Analytics } from "@/features/planner/analytics";
export default function Page() {
  return (
    <Shell>
      <Gate>
        <Analytics />
      </Gate>
    </Shell>
  );
}
