
"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Provider>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>
>(({ delayDuration = 20, ...props }, ref) => (
  <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} ref={ref} />
));
TooltipProvider.displayName = TooltipPrimitive.Provider.displayName

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, onPointerDownOutside, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    onPointerDownOutside={(event) => {
        if (onPointerDownOutside) {
            onPointerDownOutside(event);
        }
        // Prevent closing if the click is on the trigger itself or inside the tooltip content
        const target = event.target as HTMLElement;
        if (target.closest('[data-radix-tooltip-trigger]') || target.closest('[data-radix-popper-content-wrapper]')) {
          event.preventDefault();
        }
      }}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
