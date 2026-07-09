import { Fragment } from 'react';

/**
 * Minimal, injection-safe markdown renderer for trusted-schema content
 * (blog posts, KB articles, contracts). Everything is rendered as React
 * text nodes — raw HTML in the source is never interpreted.
 * Supports: h2/h3, paragraphs, bold, italic, inline code, links,
 * unordered/ordered lists, and blockquotes.
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Tokenize bold, italic, inline code, and links.
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern);

  parts.forEach((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (!part) return;
    if (part.startsWith('**') && part.endsWith('**')) {
      nodes.push(<strong key={key}>{part.slice(2, -2)}</strong>);
    } else if (part.startsWith('`') && part.endsWith('`')) {
      nodes.push(<code key={key}>{part.slice(1, -1)}</code>);
    } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      nodes.push(<em key={key}>{part.slice(1, -1)}</em>);
    } else if (part.startsWith('[')) {
      const match = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
      if (match) {
        const href = match[2];
        const safe = href.startsWith('/') || href.startsWith('https://') || href.startsWith('http://');
        nodes.push(
          safe ? (
            <a key={key} href={href} rel="noopener noreferrer" target={href.startsWith('/') ? undefined : '_blank'}>
              {match[1]}
            </a>
          ) : (
            <Fragment key={key}>{match[1]}</Fragment>
          ),
        );
      } else {
        nodes.push(<Fragment key={key}>{part}</Fragment>);
      }
    } else {
      nodes.push(<Fragment key={key}>{part}</Fragment>);
    }
  });
  return nodes;
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  const blocks = content.split(/\n{2,}/);

  return (
    <div className={`prose-vesion ${className ?? ''}`}>
      {blocks.map((block, bi) => {
        const trimmed = block.trim();
        if (!trimmed) return null;
        const key = `b-${bi}`;

        if (trimmed.startsWith('## ')) {
          return <h2 key={key}>{renderInline(trimmed.slice(3), key)}</h2>;
        }
        if (trimmed.startsWith('### ')) {
          return <h3 key={key}>{renderInline(trimmed.slice(4), key)}</h3>;
        }
        if (trimmed.startsWith('> ')) {
          return <blockquote key={key}>{renderInline(trimmed.replace(/^> /gm, ''), key)}</blockquote>;
        }

        const lines = trimmed.split('\n');
        if (lines.every((l) => /^[-•] /.test(l.trim()))) {
          return (
            <ul key={key}>
              {lines.map((l, li) => (
                <li key={`${key}-${li}`}>{renderInline(l.trim().slice(2), `${key}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\d+\. /.test(l.trim()))) {
          return (
            <ol key={key}>
              {lines.map((l, li) => (
                <li key={`${key}-${li}`}>
                  {renderInline(l.trim().replace(/^\d+\. /, ''), `${key}-${li}`)}
                </li>
              ))}
            </ol>
          );
        }

        return <p key={key}>{renderInline(lines.join(' '), key)}</p>;
      })}
    </div>
  );
}
