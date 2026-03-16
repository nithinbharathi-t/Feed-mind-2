import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { startOfMonth } from "date-fns";
import dynamic from "next/dynamic";

const Sidebar = dynamic(
  () => import("@/components/shared/sidebar").then((m) => m.Sidebar),
  {
    ssr: false,
    loading: () => (
      <aside className="fixed left-0 top-0 h-screen w-64 bg-[hsl(240,10%,5%)] border-r border-border/40 z-50" />
    ),
  }
);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/auth");

  // Responses this month
  const startOfCurrentMonth = startOfMonth(new Date());
  const responsesThisMonth = await prisma.response.count({
    where: {
      form: { userId: user.id },
      submittedAt: { gte: startOfCurrentMonth },
    },
  });

  // Unresolved integrity alerts (spam + flagged)
  const integrityAlerts = await prisma.response.count({
    where: {
      form: { userId: user.id },
      OR: [{ isSpam: true }, { isFlagged: true }],
    },
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        user={{
          name: user.name,
          email: user.email,
          image: session.user.image ?? null,
        }}
        responsesThisMonth={responsesThisMonth}
        responsesLimit={100}
        integrityAlerts={integrityAlerts}
      />
      <main className="flex-1 ml-64 min-h-screen px-9 py-6">{children}</main>
    </div>
  );
}
