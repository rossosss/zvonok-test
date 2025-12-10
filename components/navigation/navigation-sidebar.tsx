import { currentProfile } from "@/lib/current-profile"
import { pool } from "@/lib/db";
import { redirect } from "next/navigation";
import { NavigationAction } from "./navigation-action";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavigationItem } from "./navigation-item";
import { ModeToggle } from "../mode-toggle";
import { UserButton } from "@clerk/nextjs";

export const NavigationSidebar = async () => {
  const profile = await currentProfile();

  if(!profile) {
    return redirect("/");
  }

  const result = await pool.query(
    `
    SELECT 
      s.id,
      s.name,
      s.image_url AS "imageUrl",
      s.invite_code AS "inviteCode",
      s.profile_id AS "profileId"
    FROM servers s
    JOIN members m ON m.server_id = s.id
    WHERE m.profile_id = $1
    `,
    [profile.id],
  );

  const servers = result.rows;


  return (
    <div className="space-y-4 flex flex-col items-center h-full text-primary w-full dark:bg-[#1E1F22] py-3">
      <NavigationAction />

      <Separator 
        className="h-0.5 bg-zinc-300 dark:bg-zinc-700 rounded-md w-10 mx-auto"
      />
      <ScrollArea className="flex-1 w-full">
        {servers.map((server) =>(
          <div key={server.id} className="mb-4">
            <NavigationItem
              id={server.id}
              imageUrl={server.imageUrl}
              name={server.name}
            />
          </div>
        ))}
      </ScrollArea>
      <div className="pb-3 mt-auto flex items-center flex-col gap-y-4">
        <ModeToggle />
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "h-12 w-12"
            }
          }}
        />
      </div>
    </div>
  )
}