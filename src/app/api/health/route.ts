import { adminConfigured } from "@/lib/firebase/admin";
export function GET() {
  return Response.json({
    status: "ok",
    milestone: 1,
    firebaseConfigured: adminConfigured(),
    externalServicesVerified: false,
  });
}
