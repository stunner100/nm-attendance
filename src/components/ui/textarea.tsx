import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-base text-neutral-950 shadow-[inset_0_1px_3px_rgba(15,23,42,0.04)] transition-colors outline-none placeholder:text-neutral-400 focus-visible:border-neutral-300 focus-visible:bg-white focus-visible:ring-3 focus-visible:ring-neutral-200/70 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus-visible:border-white/20 dark:focus-visible:bg-neutral-950 dark:focus-visible:ring-white/10 dark:disabled:bg-neutral-800 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
