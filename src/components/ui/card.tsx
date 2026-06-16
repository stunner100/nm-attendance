import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card relative flex flex-col gap-4 overflow-hidden rounded-4xl bg-gray-100 p-2 text-sm text-card-foreground shadow-[inset_0_1px_0_0_var(--color-gray-200),inset_0_2px_0_0_rgba(255,255,255,0.95),0_18px_50px_rgba(15,23,42,0.06)] transition-all duration-300 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:p-1.5 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-[22px] *:[img:last-child]:rounded-[22px] dark:bg-neutral-900 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_18px_50px_rgba(0,0,0,0.24)]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-[22px] px-4 pt-3 group-data-[size=sm]/card:px-3 group-data-[size=sm]/card:pt-2 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-semibold tracking-tight text-neutral-950 group-data-[size=sm]/card:text-sm dark:text-neutral-50",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm leading-relaxed text-neutral-500 dark:text-neutral-400", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "rounded-[22px] bg-white px-4 py-4 shadow-[inset_0_1px_3px_rgba(15,23,42,0.035)] ring-1 ring-neutral-200/60 group-data-[size=sm]/card:px-3 group-data-[size=sm]/card:py-3 dark:bg-neutral-950 dark:ring-white/10",
        className
      )}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-[22px] border border-neutral-200/70 bg-white p-4 shadow-[inset_0_1px_3px_rgba(15,23,42,0.035)] group-data-[size=sm]/card:p-3 dark:border-white/10 dark:bg-neutral-950",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
