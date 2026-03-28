import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@adpilot/db";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold">Invalid or Expired Invitation</h1>
          <p className="text-gray-500 mt-2">
            This invitation link is no longer valid.
          </p>
        </div>
      </main>
    );
  }

  // If not signed in, redirect to sign-in with return URL
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/invite/${token}`);
  }

  // Accept invitation
  await prisma.$transaction([
    prisma.membership.create({
      data: {
        userId: session.user.id,
        orgId: invitation.orgId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        acceptedAt: new Date(),
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  redirect("/dashboard");
}
