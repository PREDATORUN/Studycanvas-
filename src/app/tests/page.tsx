import { Shell } from "@/components/shell";
import { Mocks } from "@/features/learning/mocks";
import { Gate } from "@/components/gate";
export default function Page() {
  return (
    <Shell>
      <Gate>
        <Mocks />
      </Gate>
    </Shell>
  );
}
