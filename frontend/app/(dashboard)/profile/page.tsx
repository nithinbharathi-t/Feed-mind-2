import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileClient } from "./client";
import { decodeUserSecrets } from "@/lib/user-secrets";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth");

  const enrichedSessionUser = session.user as {
    firstName?: string;
    lastName?: string;
    locale?: string;
    provider?: string;
  };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/auth");

  const secrets = decodeUserSecrets(user.customApiKey);

  return (
    <div className="space-y-6">
      <PageHeader heading="Profile" description="Manage your account and API settings" />
      <ProfileClient
        user={{
          name: user.name || "",
          email: user.email,
          image: user.image || "",
          hasApiKey: !!secrets.groqApiKey,
          hasSlackWebhook: !!secrets.slackWebhookUrl,
          aiProvider: user.aiProvider || "gemini",
          aiProviderEnabled: user.aiProviderEnabled ?? true,
          firstName: enrichedSessionUser.firstName || "",
          lastName: enrichedSessionUser.lastName || "",
          locale: enrichedSessionUser.locale || "",
          provider: enrichedSessionUser.provider || "",
        }}
      />
    </div>
  );
}
