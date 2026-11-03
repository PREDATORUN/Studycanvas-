import { Shell } from "@/components/shell";
import { Gate } from "@/components/gate";
import { Dashboard } from "@/components/dashboard";
export default function Page() {
  return (
    <Shell>
      <Gate>
        <Dashboard />
      </Gate>
    </Shell>
  );
}
