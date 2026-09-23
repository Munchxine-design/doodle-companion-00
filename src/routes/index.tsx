import { createFileRoute } from "@tanstack/react-router";
import { MaxineApp } from "@/components/MaxineApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TeriDayo — Arte digital 2D y 3D" },
      { name: "description", content: "El universo creativo de TeriDayo: ilustración 2D, modelos 3D, VRChat y comunidad." },
      { property: "og:title", content: "TeriDayo — Arte digital 2D y 3D" },
      { property: "og:description", content: "Explora el portafolio, proceso creativo y comunidad de TeriDayo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <MaxineApp/>;
}
