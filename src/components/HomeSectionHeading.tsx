import type { ReactNode } from 'react';
import './HomeSectionHeading.css';

export function HomeSectionHeading({ eyebrow, title, description, id, action }: { eyebrow: string; title: string; description: string; id?: string; action?: ReactNode }) {
  return <header className="home-section-heading">
    <div className="home-section-heading-copy">
      <div className="home-section-eyebrow"><span />{eyebrow}</div>
      <h2 id={id}>{title}</h2>
      <p>{description}</p>
    </div>
    {action && <div className="home-section-heading-action">{action}</div>}
  </header>;
}
