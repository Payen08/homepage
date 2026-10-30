import type { ReactNode } from 'react';

export function ManagementPage({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`aw-management-page ${className}`}>{children}</div>;
}

export function ManagementHeading({ title, description, children }: { title: ReactNode; description: string; children?: ReactNode }) {
  return <header className="aw-management-heading"><div><h1>{title}</h1><p>{description}</p></div>{children && <div className="aw-management-heading-actions">{children}</div>}</header>;
}

export function ManagementTabs({ label, value, options, onChange }: { label: string; value: string; options: { id: string; label: string; count?: number }[]; onChange: (value: string) => void }) {
  return <div className="aw-management-tabs" role="tablist" aria-label={label}>{options.map(option => <button key={option.id} type="button" role="tab" aria-selected={option.id === value} className={option.id === value ? 'is-selected' : ''} onClick={() => onChange(option.id)}>{option.label}{option.count !== undefined && <span>{option.count}</span>}</button>)}</div>;
}
