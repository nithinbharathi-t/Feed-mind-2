import { getFormById } from "@/server/actions/forms";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsClient } from "./client";

export default async function SettingsPage({ params }: { params: { formId: string } }) {
  const form = await getFormById(params.formId);
  if (!form) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <PageHeader heading={`Settings: ${form.title}`} description="Manage form settings, sharing, and notifications" />
      <SettingsClient
        form={{
          id: form.id,
          title: form.title,
          description: form.description || "",
          isPublished: form.isPublished,
          isAnonymous: form.isAnonymous,
          allowMultiple: form.allowMultiple,
          emailCollection: form.emailCollection as "NONE" | "VERIFIED" | "INPUT",
          expiresAt: form.expiresAt?.toISOString() || null,
        }}
      />
    </div>
  );
}
