import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MarkdownRenderer } from './markdown';

describe('MarkdownRenderer Component', () => {
  
  it('should render headers correctly', () => {
    const text = '# Header 1\n## Header 2\n### Header 3';
    render(<MarkdownRenderer text={text} />);

    // Verify headers are compiled to correct HTML tags
    // Headers हरू सही HTML tag मा compile भएको verify गर्ने
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Header 1');
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Header 2');
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Header 3');
  });

  it('should render lists correctly', () => {
    const text = '- Bullet item 1\n1. Numbered item 1';
    const { container } = render(<MarkdownRenderer text={text} />);

    // Verify bullet lists and numbered lists are rendered
    // Bullet lists र numbered lists हरू render भएको check गर्ने
    expect(container.querySelector('ul.markdown-bullet-list')).toBeInTheDocument();
    expect(container.querySelector('ol.markdown-numbered-list')).toBeInTheDocument();
    expect(screen.getByText('Bullet item 1')).toBeInTheDocument();
    expect(screen.getByText('Numbered item 1')).toBeInTheDocument();
  });

  it('should parse bold, italic, and inline code formatting', () => {
    const text = 'This is **bold**, *italic*, and `inline code`.';
    const { container } = render(<MarkdownRenderer text={text} />);

    // Verify bold, italic, and inline code elements
    // bold, italic, र inline code elements हरूको जाँच गर्ने
    expect(container.querySelector('strong')).toHaveTextContent('bold');
    expect(container.querySelector('em')).toHaveTextContent('italic');
    expect(container.querySelector('code.markdown-inline-code')).toHaveTextContent('inline code');
  });

  it('should render multi-line code blocks with language tag', () => {
    const text = '```javascript\nconst a = 123;\nconsole.log(a);\n```';
    const { container } = render(<MarkdownRenderer text={text} />);

    // Verify code block structure and content
    // Code block structure र त्यस भित्रको text check गर्ने
    const pre = container.querySelector('pre.markdown-code-block');
    expect(pre).toBeInTheDocument();
    expect(pre?.querySelector('.code-block-lang')).toHaveTextContent('javascript');
    expect(pre?.querySelector('code')?.textContent).toBe('const a = 123;\nconsole.log(a);');
  });
});
