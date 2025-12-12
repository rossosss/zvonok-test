import { ServerSidebar } from "@/components/server/server-sidebar";
import { currentProfile } from "@/lib/current-profile";
import { pool } from "@/lib/db";
import { RedirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";



const ServerIdLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ serverId: string }>;
}) => {
  const profile = await currentProfile();
  const { serverId } = await params;

  if (!profile) {
    return RedirectToSignIn({ redirectUrl: "/sign-in" });
  }

  const result = await pool.query(
  `
  SELECT s.*
  FROM servers s
  JOIN members m ON m.server_id = s.id
  WHERE s.id = $1
    AND m.profile_id = $2
  LIMIT 1
  `,
  [serverId, profile.id],
);

const server = result.rows[0] || null;

  if(!server) {
    return redirect("/")
  }

  return ( 
    <div className="h-full">
      <div className="hidden md:flex h-full w-60 z-20 flex-col fixed inset-y-0">
        <ServerSidebar serverId = { serverId } />
      </div>
      <main className="h-full md:pl-60">
        {children}
      </main>
    </div>
   );
}
 
export default ServerIdLayout;