import { createFileRoute } from "@tanstack/react-router";
import App from "@/rmacts/App";

export const Route = createFileRoute("/")({
  // Firebase Auth runs in the browser only.
  ssr: false,
  head: () => ({
    meta: [
      { title: "RMACTS Learning Box" },
      { name: "description", content: "RMACTS Learning Box - Student learning resources" },
      { property: "og:title", content: "RMACTS Learning Box" },
      { property: "og:description", content: "RMACTS Learning Box - Student learning resources" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});
