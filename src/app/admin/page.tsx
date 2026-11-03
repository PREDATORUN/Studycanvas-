import { Shell } from "@/components/shell";
import { Gate } from "@/components/gate";
import { Admin } from "@/features/social/admin";
export default function Page() {
  return (
    <Shell>
      <Gate>
        <Admin />
      </Gate>
    </Shell>
  );
}
