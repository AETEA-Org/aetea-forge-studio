import ReactMarkdown from 'react-markdown';
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

  const components = {
    // Style links - replace references with icons
    a: ({ node, href, children: linkChildren, ...props }: any) => {
      // Extract display name from children (react-markdown passes text as children)
      let displayName = '';
      
      if (typeof linkChildren === 'string') {
        displayName = linkChildren;
      } else if (Array.isArray(linkChildren)) {
        // Flatten nested children to get text content
        const extractText = (child: any): string => {
          if (typeof child === 'string') return child;
          if (typeof child === 'number') return String(child);
          if (child?.props?.children) {
            const nested = child.props.children;
            if (typeof nested === 'string') return nested;
            if (Array.isArray(nested)) return nested.map(extractText).join('');
          }
          return '';
        };
        displayName = linkChildren.map(extractText).join('');
      } else if (linkChildren) {
        displayName = String(linkChildren);
      }
      
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
    strong: ({ node, ...props }: any) => (
      <strong {...props} className="font-semibold" />
    ),
    // Style emphasis/italic
    em: ({ node, ...props }: any) => (
      <em {...props} className="italic" />
    ),
    // Style code
    code: ({ node, ...props }: any) => (
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
            p: ({ children }: any) => <>{children}</>, // No paragraph wrapper for inline
          }}
        >
          {children}
        </ReactMarkdown>
      </span>
    );
  }

  // For block rendering, include paragraph and list styling
  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        components={{
          ...components,
          // Style paragraphs
          p: ({ node, ...props }: any) => (
            <p {...props} className="mb-2 last:mb-0 break-words" />
          ),
          // Style lists
          ul: ({ node, ...props }: any) => (
            <ul {...props} className="space-y-1" />
          ),
          li: ({ node, ...props }: any) => (
            <li {...props} className="break-words" />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
