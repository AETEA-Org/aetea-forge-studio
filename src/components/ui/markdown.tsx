import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  children: string | null | undefined;
  className?: string;
  inline?: boolean;
}

export function Markdown({ children, className, inline = false }: MarkdownProps) {
  // Return null if no content
  if (!children) return null;

  const components = {
    // Style links
    a: ({ node, ...props }: any) => (
      <a 
        {...props} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-primary hover:underline break-words"
      />
    ),
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
