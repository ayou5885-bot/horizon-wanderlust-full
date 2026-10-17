import { useI18n } from "@/lib/i18n";

export type ContactState = { name: string; phone: string; email: string; notes: string };

export function ContactFields({ value, onChange }: { value: ContactState; onChange: (v: ContactState) => void }) {
  const { t } = useI18n();
  const field = "mt-1 w-full rounded-lg border bg-background px-3 py-2";
  return (
    <>
      <label className="block text-sm font-medium">{t("fullName")}
        <input required maxLength={120} value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} className={field} />
      </label>
      <label className="block text-sm font-medium">{t("phone")}
        <input required type="tel" dir="ltr" maxLength={20} pattern="[+0-9 ]{8,20}" value={value.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })} className={field} />
      </label>
      <label className="block text-sm font-medium">{t("email")}
        <input required type="email" dir="ltr" maxLength={160} value={value.email} onChange={(e) => onChange({ ...value, email: e.target.value })} className={field} />
      </label>
      <label className="block text-sm font-medium">{t("notes")}
        <textarea maxLength={1000} rows={2} value={value.notes} onChange={(e) => onChange({ ...value, notes: e.target.value })} className={field} />
      </label>
    </>
  );
}
