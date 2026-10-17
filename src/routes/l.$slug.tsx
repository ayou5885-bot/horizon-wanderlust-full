import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useLandingPage, type ContentBlock } from "@/hooks/use-landing-pages";

export const Route = createFileRoute("/l/$slug")({
  head: () => ({
    meta: [
      { title: "Offre spéciale — Sahara Voyages" },
      { name: "description", content: "Offres saisonnières de notre agence de voyage." },
      { property: "og:title", content: "Offre spéciale — Sahara Voyages" },
      { property: "og:description", content: "Découvrez nos offres du moment." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { slug } = Route.useParams();
  const { t } = useI18n();
  const { data: page, isLoading } = useLandingPage(slug);
  if (isLoading) return <p className="p-10">{t("loading")}</p>;
  const now = Date.now();
  if (!page || (page.starts_at && new Date(page.starts_at).getTime() > now) || (page.ends_at && new Date(page.ends_at).getTime() < now))
    return <p className="p-10">{t("notFound")}</p>;
  const blocks = (Array.isArray(page.content_blocks) ? page.content_blocks : []) as unknown as ContentBlock[];
  return (
    <>
      <div className="relative flex h-[60vh] min-h-80 items-end">
        {page.hero_image && <img src={page.hero_image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="hero-overlay absolute inset-0" />
        <h1 className="relative mx-auto w-full max-w-5xl px-4 pb-12 text-5xl font-bold text-ink-foreground">{page.title}</h1>
      </div>
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
        {blocks.map((b, i) => b.type === "text" ? (
          <section key={i}>{b.heading && <h2 className="mb-2 text-2xl font-bold">{b.heading}</h2>}<p className="whitespace-pre-line text-lg">{b.body}</p></section>
        ) : b.type === "image" ? (
          <img key={i} src={b.src} alt={b.alt ?? ""} loading="lazy" className="w-full rounded-2xl" />
        ) : (
          <Link key={i} to={b.href} className="inline-flex rounded-full bg-accent px-8 py-3 font-semibold text-accent-foreground">{b.label}</Link>
        ))}
      </div>
    </>
  );
}
