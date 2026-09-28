import { isValidElement, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { cn } from '@/lib/utils';
import { ReferenceIcon, isReferenceLink } from '@/components/ui/reference-icon';

interface MarkdownProps {
  children: string | null | undefined;
  className?: string;
  inline?: boolean;
}

export function Markdown({ children, className, inline = false }: MarkdownProps) {
  // Return null if no content
  if (!children) return null;

  const extractText = (child: ReactNode): string => {
    if (typeof child === 'string' || typeof child === 'number') return String(child);
    if (Array.isArray(child)) return child.map(extractText).join('');
    if (isValidElement<{ children?: ReactNode }>(child)) {
      return extractText(child.props.children);
    }
    return '';
  };

  const components: Components = {
    // Style links - replace references with icons
    a: ({ href, children: linkChildren, ...props }) => {
      // Extract display name from children (react-markdown passes text as children)
      let displayName = '';
      
      displayName = extractText(linkChildren);
      
      // Check if this is a reference link
      if (href && displayName && isReferenceLink(displayName)) {
        return (
          <ReferenceIcon 
            displayName={displayName} 
            url={href}
            className="mx-0.5"
          />
        );
      }
      
      // Regular link - render as text
      return (
        <a 
          href={href}
          {...props} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-primary hover:underline break-words"
        >
          {linkChildren}
        </a>
      );
    },
    // Style strong/bold
    strong: (props) => (
      <strong {...props} className="font-semibold" />
    ),
    // Style emphasis/italic
    em: (props) => (
      <em {...props} className="italic" />
    ),
    // Style code
    code: (props) => (
      <code {...props} className="bg-muted px-1 py-0.5 rounded text-sm" />
    ),
  };

  // For inline rendering, render without wrapper and paragraph tags
  if (inline) {
    return (
      <span className={cn("inline", className)}>
        <ReactMarkdown
          components={{
            ...components,
            p: ({ children: paragraphChildren }) => <>{paragraphChildren}</>, // No paragraph wrapper for inline
          }}
        >
          {children}
        </ReactMarkdown>
      </span>
    );
  }

  // For block rendering, include paragraph and list styling
  return (
    <div className={cn("markdown-content break-words", className)} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
      <ReactMarkdown
        components={{
          ...components,
          // Style paragraphs
          p: (props) => (
            <p {...props} className="mb-2 last:mb-0 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }} />
          ),
          // Style lists (list-disc/pl-5 restore bullets; Tailwind Preflight removes list-style)
          ul: (props) => (
            <ul {...props} className="list-disc pl-5 space-y-1 break-words my-2" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }} />
          ),
          ol: (props) => (
            <ol {...props} className="list-decimal pl-5 space-y-1 break-words my-2" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }} />
          ),
          li: (props) => (
            <li {...props} className="break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }} />
          ),
          // Style code blocks
          pre: (props) => (
            <pre {...props} className="overflow-x-auto break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }} />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
