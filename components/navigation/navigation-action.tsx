"use client"

import { Plus } from "lucide-react"

import { ActionTooltip } from "../action-tooltip"
import { useModal } from "@/hooks/use-modal-store"

export const NavigationAction = () => {
  const { onOpen } = useModal();

  return (
    <div>
      <ActionTooltip
        side="right"
        align="center"
        label="Создать сервер"
      >
        <button
          onClick={() => onOpen("createServer")}
          className="group flex items-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl overflow-hidden transition-all group-hover:rounded-2xl bg-neutral-700 dark:bg-neutral-700 hover:bg-emerald-500 dark:hover:bg-emerald-500">
            <Plus 
              className="group-hover:text-white transition text-emerald-500 "
              size={25}
            />
          </div>
        </button>
      </ActionTooltip>
    </div>
  )
}