import { adminConfigured } from "@/lib/firebase/admin";
export function GET() {
  return Response.json({
    status: "ok",
    milestone: "core-1-5",
    releaseReady: false,
    firebaseConfigured: adminConfigured(),
    externalServicesVerified: false,
  });
}
