import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function AgentResourceModal({ title, subtitle, children, close, className = '' }: { title: string; subtitle?: string; children: ReactNode; close: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => { element?.close(); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className={`aw-modal ${className}`} aria-label={title} onCancel={event => { event.preventDefault(); close(); }}>
    <div className="aw-modal-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="aw-icon-button" aria-label={`关闭${title}`} onClick={close}><X size={16} /></button></div>
    {children}
  </dialog>;
}
