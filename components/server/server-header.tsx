"use client";

import { ServerWithMembersWithProfiles, MemberRole } from "@/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, PlusCircle, Settings, Trash, User, UserPlus } from "lucide-react";

interface ServerHeaderProps {
  server: ServerWithMembersWithProfiles;
  role?: MemberRole;
}

export const ServerHeader = ({
  server,
  role
}: ServerHeaderProps) => {
  const isAdmin = role === "ADMIN";
  const isModarator = isAdmin || role === "MODERATOR";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="focus:outline-none"
        asChild
      >
        <button 
          className="w-full text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2 hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition"
        >
          {server.name}
          <ChevronDown className="h-5 w-5 ml-auto" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 text-xl font-medium text-black dark:text-neutral-400 space-y-0.5"
      >
        {isModarator && (
          <DropdownMenuItem
            className="text-indigo-500 dark:text-indigo-400 px-3 py-2 text-sm cursor-pointer"
          >
            Пригласить...
            <UserPlus className="h-4 w-4 ml-auto" />
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <DropdownMenuItem
            className="px-3 py-2 text-sm cursor-pointer"
          >
            Настройки Сервера
            <Settings className="h-4 w-4 ml-auto" />
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <DropdownMenuItem
            className="px-3 py-2 text-sm cursor-pointer"
          >
            Участники...
            <User className="h-4 w-4 ml-auto" />
          </DropdownMenuItem>
        )}
        {isModarator && (
          <DropdownMenuItem
            className="px-3 py-2 text-sm cursor-pointer"
          >
            Создать Канал
            <PlusCircle className="h-4 w-4 ml-auto" />
          </DropdownMenuItem>
        )}
        {isModarator && (
          <DropdownMenuSeparator />
        )}
        {isAdmin && (
          <DropdownMenuItem
            className="text-rose-500 px-3 py-2 text-sm cursor-pointer"
          >
            Удалить Сервер
            <Trash className="h-4 w-4 ml-auto" />
          </DropdownMenuItem>
        )}
        {!isAdmin && (
          <DropdownMenuItem
            className="text-rose-500 px-3 py-2 text-sm cursor-pointer"
          >
            Покинуть Сервер
            <LogOut className="h-4 w-4 ml-auto" />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}