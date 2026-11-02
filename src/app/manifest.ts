import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StudyCanvas",
    short_name: "StudyCanvas",
    description: "Your private learning workspace",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFF",
    theme_color: "#5265F6",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
