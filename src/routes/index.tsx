import { createFileRoute } from "@tanstack/react-router";
import { MaxineApp } from "@/components/MaxineApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Munchxine — Ilustración, modelos y comunidad" },
      { name: "description", content: "El universo creativo de Munchxine: ilustración 2D, modelos para VRChat y comunidad." },
      { property: "og:title", content: "Munchxine — Ilustración, modelos y comunidad" },
      { property: "og:description", content: "Explora el portafolio, proceso creativo y comunidad de Munchxine." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <MaxineApp/>;
}
