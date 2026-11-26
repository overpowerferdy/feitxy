import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/feit/shell";
import { BodyView } from "@/components/feit/body-view";

export const Route = createFileRoute("/wellness")({
  head: () => ({ meta: [{ title: "Body — Feit" }, { name: "description", content: "Log steps, runs, sleep, body weight, meals and food spending." }, { property: "og:title", content: "Body — Feit" }, { property: "og:description", content: "Log steps, runs, sleep, body weight, meals and food spending." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <Shell><BodyView /></Shell>,
});
