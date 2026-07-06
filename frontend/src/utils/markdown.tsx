import React from 'react';

/**
 * A lightweight custom React Markdown renderer that parses headers, bold, italics,
 * inline code, code blocks, bullet points, and numbered lists.
 * 
 * बाह्य पुस्तकालय विना Markdown लाई React Element मा रूपान्तरण गर्ने custom component.
 */
export const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  // Regex to match code blocks: ```[lang] \n [code] \n ```
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)\n?```/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index);
    if (textBefore) {
      parts.push(...parseInlineMarkdown(textBefore));
    }

    const language = match[1];
    const code = match[2];
    parts.push(
      <pre key={`code-${match.index}`} className="markdown-code-block">
        {language && <span className="code-block-lang">{language}</span>}
        <code>{code}</code>
      </pre>
    );

    lastIndex = codeBlockRegex.lastIndex;
  }

  const remainingText = text.slice(lastIndex);
  if (remainingText) {
    parts.push(...parseInlineMarkdown(remainingText));
  }

  return <div className="markdown-content">{parts}</div>;
};

/**
 * Parses block level elements like headers, lists, and paragraphs.
 * 
 * Headers, lists र paragraphs जस्ता block elements parse गर्ने।
 */
function parseInlineMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    // 1. Headers: #, ##, ###
    if (line.startsWith('### ')) {
      return <h3 key={lineIdx}>{parseTextDecorations(line.slice(4))}</h3>;
    }
    if (line.startsWith('## ')) {
      return <h4 key={lineIdx}>{parseTextDecorations(line.slice(3))}</h4>;
    }
    if (line.startsWith('# ')) {
      return <h2 key={lineIdx}>{parseTextDecorations(line.slice(2))}</h2>;
    }

    // 2. Bullet list: - or *
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const bulletContent = line.trim().substring(2);
      return (
        <ul key={lineIdx} className="markdown-bullet-list">
          <li>{parseTextDecorations(bulletContent)}</li>
        </ul>
      );
    }

    // 3. Numbered list: 1.
    const numListMatch = line.trim().match(/^(\d+)\.\s(.*)/);
    if (numListMatch) {
      const itemContent = numListMatch[2];
      return (
        <ol key={lineIdx} className="markdown-numbered-list" start={parseInt(numListMatch[1], 10)}>
          <li>{parseTextDecorations(itemContent)}</li>
        </ol>
      );
    }

    // Default: paragraph or empty line spacer
    if (line.trim() === '') {
      return <div key={lineIdx} className="markdown-spacer" />;
    }

    return <p key={lineIdx} style={{ margin: '4px 0', lineHeight: 1.5 }}>{parseTextDecorations(line)}</p>;
  });
}

/**
 * Parses inline level text decorators like bold, italic, and inline code.
 * 
 * बोल्ड (**), इटालिक (*), र inline code (`) जस्ता सजावटहरू parse गर्ने।
 */
function parseTextDecorations(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const decorationRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const splitParts = text.split(decorationRegex);

  splitParts.forEach((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      parts.push(
        <code key={idx} className="markdown-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    } else if (part.startsWith('**') && part.endsWith('**')) {
      parts.push(<strong key={idx}>{part.slice(2, -2)}</strong>);
    } else if (part.startsWith('*') && part.endsWith('*')) {
      parts.push(<em key={idx}>{part.slice(1, -1)}</em>);
    } else {
      parts.push(part);
    }
  });

  return parts;
}
