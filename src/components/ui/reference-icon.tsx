import * as React from "react";
import { Link2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ReferenceIconProps {
  displayName: string;
  url: string;
  className?: string;
}

/**
 * Checks if a link should be treated as a reference (shows icon instead of text)
 * References are typically numeric (e.g., [28], [10]) or short codes
 * We want to preserve natural link text like "click here", "read more", etc.
 */
export function isReferenceLink(displayName: string): boolean {
  const trimmed = displayName.trim();
  
  // Treat as reference if display name is numeric (most common case)
  const isNumeric = /^\d+$/.test(trimmed);
  if (isNumeric) return true;
  
  // Check if it looks like a reference number with brackets (e.g., "[28]", "28", etc.)
  const looksLikeReferenceNumber = /^\[?\d+\]?$/.test(trimmed);
  if (looksLikeReferenceNumber) return true;
  
  // Very short display names (1-3 chars) that aren't common link words
  const commonLinkWords = ['here', 'more', 'link', 'read', 'view', 'see', 'go', 'click', 'open'];
  const isVeryShort = trimmed.length <= 3 && !commonLinkWords.includes(trimmed.toLowerCase());
  
  // Short alphanumeric codes (likely references)
  const isShortCode = trimmed.length <= 10 && /^[a-z0-9]+$/i.test(trimmed) && trimmed.length <= 6;
  
  return isVeryShort || isShortCode;
}

export function ReferenceIcon({ displayName, url, className }: ReferenceIconProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Extract domain from URL for display
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url.length > 50 ? url.substring(0, 50) + "..." : url;
    }
  };

  const domain = getDomain(url);
  const truncatedUrl = url.length > 60 ? url.substring(0, 60) + "..." : url;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className={cn(
            "inline-flex items-center justify-center",
            "h-5 w-5 rounded-full",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 hover:scale-110",
            "transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            "align-middle",
            "shadow-sm",
            className
          )}
          aria-label={`Reference ${displayName}: ${url}`}
        >
          <Link2 className="h-3 w-3" strokeWidth={2.5} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        className="max-w-sm p-3"
        sideOffset={6}
      >
        <div className="space-y-2">
          <div className="font-medium text-sm">
            Reference {displayName}
          </div>
          <div className="text-xs text-muted-foreground break-all">
            {truncatedUrl}
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-border">
            <button
              onClick={handleCopy}
              className="text-xs text-primary hover:underline focus:outline-none"
            >
              {copied ? "Copied!" : "Copy URL"}
            </button>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{domain}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
