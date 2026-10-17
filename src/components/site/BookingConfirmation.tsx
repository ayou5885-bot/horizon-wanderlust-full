import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { BookingNotice } from "./Cards";

export function BookingConfirmation({ token, phone }: { token: string; phone: string }) {
  const { t } = useI18n();
  const href = typeof window !== "undefined"
    ? `${window.location.origin}/track?phone=${encodeURIComponent(phone)}&token=${token}` : "";
  return (
    <div className="space-y-4 rounded-2xl bg-card p-6 shadow-card">
      <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
      <h2 className="text-2xl font-bold">{t("confirmTitle")}</h2>
      <p>{t("trackingCode")}: <strong dir="ltr" className="font-mono text-lg">{token}</strong></p>
      <p className="text-sm text-muted-foreground">{t("confirmText")}</p>
      <p dir="ltr" className="break-all rounded-lg bg-muted p-3 font-mono text-xs">{href}</p>
      <BookingNotice />
      <Link to="/track" search={{ phone, token }} className="inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">
        {t("goTrack")}
      </Link>
    </div>
  );
}
