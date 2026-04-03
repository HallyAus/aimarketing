import { prisma } from "@/lib/db";
import { CreateUserForm } from "./create-user-form";

export default async function CreateUserPage() {
  const organizations = await prisma.organization.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 24,
        }}
      >
        Create User
      </h1>
      <CreateUserForm organizations={organizations} />
    </div>
  );
}
