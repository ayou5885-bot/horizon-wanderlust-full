import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/", label: t("navHome") },
    { to: "/destinations", label: t("navDestinations") },
    { to: "/packages", label: t("navPackages") },
    { to: "/hotels", label: t("navHotels") },
    { to: "/track", label: t("navTrack") },
  ] as const;
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="font-display text-xl font-bold text-primary">
          {lang === "ar" ? siteConfig.nameAr : siteConfig.name}
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-foreground/80 hover:text-primary"
              activeProps={{ className: "text-primary" }} activeOptions={{ exact: l.to === "/" }}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            aria-label={t("switchLangLabel")}
          >
            <Languages className="h-4 w-4" aria-hidden /> {t("switchLang")}
          </button>
          <button className="rounded-md p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t px-4 py-3 md:hidden" aria-label="Mobile">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block py-2 font-medium">
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
