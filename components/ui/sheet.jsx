"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetPortal = DialogPrimitive.Portal;
const SheetClose = DialogPrimitive.Close;

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Backdrop
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0",
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

// side="bottom" — this is the only variant this app needs (mobile picker sheet)
const SheetContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Popup
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-2xl border-t border-border bg-card p-5 pb-8 data-open:animate-in data-closed:animate-out data-closed:slide-out-to-bottom data-open:slide-in-from-bottom",
        className
      )}
      {...props}
    >
      <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-border" />
      {children}
    </DialogPrimitive.Popup>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

const SheetHeader = ({ className, ...props }) => (
  <div className={cn("mb-4 flex items-center justify-between", className)} {...props} />
);

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("font-display text-lg font-bold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose };