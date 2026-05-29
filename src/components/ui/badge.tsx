import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-500/20 text-brand-300",
        secondary: "border-transparent bg-slate-800 text-slate-300",
        destructive: "border-transparent bg-red-500/20 text-red-400",
        outline: "border-slate-700 text-slate-400",
        success: "border-transparent bg-green-500/20 text-green-400",
        warning: "border-transparent bg-yellow-500/20 text-yellow-400",
        gold: "border-transparent bg-yellow-500/20 text-yellow-300",
        streak: "border-transparent bg-orange-500/20 text-orange-400",
        xp: "border-transparent bg-purple-500/20 text-purple-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
