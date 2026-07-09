import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Markdown } from './markdown';

describe('Markdown', () => {
  it('renders headings, paragraphs, and lists', () => {
    render(
      <Markdown content={'## Title\n\nSome **bold** text.\n\n- First item\n- Second item'} />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Title' })).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('never interprets raw HTML (XSS-safe by construction)', () => {
    const { container } = render(
      <Markdown content={'<script>window.hacked = true</script> <img src=x onerror=alert(1)>'} />,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    // The dangerous markup is rendered as inert text instead.
    expect(container.textContent).toContain('<script>');
  });

  it('renders safe links and drops javascript: URLs', () => {
    render(<Markdown content={'[ok](https://vesion.dev) [bad](javascript:alert(1))'} />);
    expect(screen.getByRole('link', { name: 'ok' })).toHaveAttribute('href', 'https://vesion.dev');
    expect(screen.queryByRole('link', { name: 'bad' })).toBeNull();
    expect(screen.getByText('bad')).toBeInTheDocument();
  });

  it('renders inline code', () => {
    render(<Markdown content={'Use `pnpm dev` to start.'} />);
    expect(screen.getByText('pnpm dev').tagName).toBe('CODE');
  });
});
