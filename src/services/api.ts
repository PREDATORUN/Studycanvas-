import { browserAuth } from "@/lib/firebase/client";
export async function api<T>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  const user = browserAuth().currentUser;
  if (!user) throw new Error("Please sign in.");
  const response = await fetch(`/api/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await user.getIdToken(method !== "GET")}`,
      "Content-Type": "application/json",
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Request failed.");
  return result;
}
