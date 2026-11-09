import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      // Bottom on every size. It used to sit at the top on mobile, where it
      // landed on the app header — the one place a notice must not cover.
      "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-[380px]",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  cn(
    "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-3.5 pr-10 shadow-lg backdrop-blur-sm",
    "transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full",
  ),
  {
    variants: {
      // A toast says what kind of thing happened through its icon and one tinted
      // circle, not by flooding the whole card with colour. `destructive` used
      // to be a solid red slab, which is far too much weight for "rename
      // failed" — the message is what should be read, not the panel.
      variant: {
        default: "border-border bg-background/95 text-foreground",
        success: "border-border bg-background/95 text-foreground",
        warning: "border-border bg-background/95 text-foreground",
        destructive: "border-destructive/40 bg-background/95 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/** Which icon each variant leads with, and how its circle is tinted. */
const TOAST_ICONS = {
  default: { Icon: Info, className: "bg-muted text-muted-foreground" },
  success: {
    Icon: CheckCircle2,
    className: "bg-green-500/15 text-green-600 dark:text-green-400",
  },
  warning: {
    Icon: TriangleAlert,
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  destructive: { Icon: AlertCircle, className: "bg-destructive/15 text-destructive" },
} as const;

export type ToastVariant = keyof typeof TOAST_ICONS;

/** The leading icon, sized and tinted for its variant. */
const ToastIcon = ({ variant = "default" }: { variant?: ToastVariant | null }) => {
  const { Icon, className } = TOAST_ICONS[variant ?? "default"];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
        className,
      )}
    >
      <Icon className="h-[15px] w-[15px]" />
    </span>
  );
};

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />;
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      // Visible from the start. Hiding it until hover meant a touch device
      // never showed a way to dismiss anything.
      "absolute right-2.5 top-2.5 rounded-md p-1 text-foreground opacity-50 transition-opacity",
      "hover:bg-muted hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title ref={ref} className={cn("text-sm font-medium leading-snug", className)} {...props} />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("line-clamp-2 text-xs leading-snug text-muted-foreground", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastIcon,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
