import { createFileRoute } from "@tanstack/react-router";
import App from "@/rmacts/App";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "RMACTS Learning Hub" },
      { name: "description", content: "RMACTS Learning Hub - Student learning resources" },
      { property: "og:title", content: "RMACTS Learning Hub" },
      { property: "og:description", content: "RMACTS Learning Hub - Student learning resources" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});
