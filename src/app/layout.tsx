import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { GlassEnvironment } from "@/components/liquid-glass/environment";
import "./globals.css";
import "@/components/liquid-glass/glass.css";
export const metadata: Metadata = {
  title: {
    default: "StudyCanvas — Make room for your next breakthrough",
    template: "%s · StudyCanvas",
  },
  description: "A focused learning workspace for JEE and NEET aspirants.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <GlassEnvironment />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
