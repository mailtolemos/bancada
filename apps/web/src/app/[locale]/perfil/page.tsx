import { notFound } from "next/navigation";
import { UserCog } from "lucide-react";
import { getDictionary, isLocale } from "@bancada/core";
import { ProfileEditor } from "@/components/ProfileEditor";
import { SectionHeader } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto max-w-4xl">
      <SectionHeader title={dict.profile.title} icon={<UserCog size={15} />} />
      <p className="mb-6 -mt-1 text-sm text-neutral-500">{dict.profile.subtitle}</p>
      <ProfileEditor locale={locale} dict={dict} />
    </div>
  );
}
