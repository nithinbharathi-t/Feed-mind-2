import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileClient } from "./client";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/auth");

  return (
    <div className="space-y-6">
      <PageHeader heading="Profile" description="Manage your account and API settings" />
      <ProfileClient
        user={{
          name: user.name || "",
          email: user.email,
          image: user.image || "",
          hasApiKey: !!user.customApiKey,
        }}
      />
    </div>
  );
}
