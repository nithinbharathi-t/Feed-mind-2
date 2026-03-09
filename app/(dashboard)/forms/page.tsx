import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MyFormsClient } from "@/components/forms/my-forms-client";

export default async function MyFormsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/auth");

  const forms = await prisma.form.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: {
          responses: true,
          questions: true,
        },
      },
      responses: {
        select: { isSpam: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const formData = forms.map((f) => ({
    id: f.id,
    title: f.title,
    description: f.description,
    isPublished: f.isPublished,
    questionCount: f._count.questions,
    responseCount: f._count.responses,
    spamCount: f.responses.filter((r) => r.isSpam).length,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  }));

  const totalResponses = formData.reduce((sum, f) => sum + f.responseCount, 0);

  return (
    <MyFormsClient forms={formData} totalResponses={totalResponses} />
  );
}
