import { Facebook, Instagram, MessageCircle, Phone, MapPin, Clock, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  const { t, lang } = useI18n();
  const social = [
    { href: `https://wa.me/${siteConfig.whatsapp}`, label: t("whatsapp"), Icon: MessageCircle },
    { href: siteConfig.social.instagram, label: t("instagram"), Icon: Instagram },
    { href: siteConfig.social.facebook, label: t("facebook"), Icon: Facebook },
  ];
  return (
    <footer className="mt-24 bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-bold">{lang === "ar" ? siteConfig.nameAr : siteConfig.name}</p>
          <p className="mt-3 text-sm opacity-80">{t("footerAbout")}</p>
        </div>
        <div className="space-y-3 text-sm">
          <h2 className="text-lg font-semibold">{t("contactUs")}</h2>
          <p className="flex items-center gap-2"><Phone className="h-4 w-4" aria-hidden />
            <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`} dir="ltr">{siteConfig.phone}</a></p>
          <p className="flex items-center gap-2"><Mail className="h-4 w-4" aria-hidden />
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></p>
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4" aria-hidden />
            <span><span className="sr-only">{t("address")}: </span>{lang === "ar" ? siteConfig.addressAr : siteConfig.addressFr}</span></p>
          <p className="flex items-center gap-2"><Clock className="h-4 w-4" aria-hidden />
            <span><span className="sr-only">{t("hours")}: </span>{lang === "ar" ? siteConfig.hoursAr : siteConfig.hoursFr}</span></p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t("followUs")}</h2>
          <ul className="mt-3 space-y-2">
            {social.map(({ href, label, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-ink-foreground/20 px-4 py-2 text-sm hover:bg-ink-foreground/10">
                  <Icon className="h-4 w-4" aria-hidden /> {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="border-t border-ink-foreground/10 py-5 text-center text-xs opacity-60">
        © {new Date().getFullYear()} {siteConfig.name}. {t("rights")}
      </p>
    </footer>
  );
}
