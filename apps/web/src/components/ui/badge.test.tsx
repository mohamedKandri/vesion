import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, StatusBadge } from './badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge tone="success">Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});

describe('StatusBadge', () => {
  it('humanizes enum statuses', () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('gracefully renders unknown statuses', () => {
    render(<StatusBadge status="SOMETHING_NEW" />);
    expect(screen.getByText('Something New')).toBeInTheDocument();
  });
});
