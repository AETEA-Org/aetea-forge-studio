import { useSupport } from "./SupportContext";
import { cn } from "@/lib/utils";

/**
 * What the old `mailto:support@aetea.studio` links became.
 *
 * Same words in the same places, opening the form instead of whatever mail
 * client the browser decides to launch — which on a shared or managed machine
 * is often nothing at all.
 */
export function SupportLink({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open } = useSupport();
  return (
    <button type="button" onClick={open} className={cn("underline", className)}>
      {children}
    </button>
  );
}
