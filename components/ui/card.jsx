import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  variant,
  ...props
}) {
  const baseClasses = "flex flex-col gap-6 rounded-xl border py-6 shadow-sm";
  
  const variantClasses = {
    default: "bg-card text-card-foreground",
    gradient: "bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm border-white/20 text-card-foreground shadow-[var(--shadow-card)]",
    elevated: "bg-white shadow-lg border-0 text-card-foreground",
  };
  
  const classes = variantClasses[variant] || variantClasses.default;
  
  return (
    (<div
      data-slot="card"
      className={cn(baseClasses, classes, className)}
      {...props} />)
  );
}

function CardHeader({
  className,
  ...props
}) {
  return (
    (<div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props} />)
  );
}

function CardTitle({
  className,
  ...props
}) {
  return (
    (<div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props} />)
  );
}

function CardDescription({
  className,
  ...props
}) {
  return (
    (<div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props} />)
  );
}

function CardAction({
  className,
  ...props
}) {
  return (
    (<div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props} />)
  );
}

function CardContent({
  className,
  ...props
}) {
  return (<div data-slot="card-content" className={cn("px-6", className)} {...props} />);
}

function CardFooter({
  className,
  ...props
}) {
  return (
    (<div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props} />)
  );
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
