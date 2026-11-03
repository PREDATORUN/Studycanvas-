import { Shell } from "@/components/shell";
import { Gate } from "@/components/gate";
import { Board } from "@/features/social/board";
export default function Page() {
  return (
    <Shell>
      <Gate>
        <Board kind="notifications" />
      </Gate>
    </Shell>
  );
}
