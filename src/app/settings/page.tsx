import { Shell } from "@/components/shell";
import { Gate } from "@/components/gate";
import { Settings } from "@/components/settings";
export default function Page() {
  return (
    <Shell>
      <Gate>
        <Settings />
      </Gate>
    </Shell>
  );
}
