import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const state = false;

export default function Home() {
  return (
    <div>
      <p className="text-3xl font-bold text-indigo-500">
        Hello Zvonok!
      </p>
      <Button>
        Click me!
      </Button>
    </div>
  )
}
