import { Shell } from "@/components/shell";
import { Gate } from "@/components/gate";
import { Onboarding } from "@/components/onboarding";
export default function Page() {
  return (
    <Shell>
      <Gate>
        <Onboarding />
      </Gate>
    </Shell>
  );
}
