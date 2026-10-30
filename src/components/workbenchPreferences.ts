import { useCallback, useState } from 'react';

export function useWorkbenchPreference(name: string, initialValue: () => boolean) {
  const key = `moying.workbench.${name}`;
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved === 'true' || saved === 'false') return saved === 'true';
    } catch { /* The control still works when storage is unavailable. */ }
    return initialValue();
  });
  const update = useCallback((next: boolean) => {
    setValue(next);
    try { localStorage.setItem(key, String(next)); } catch { /* Keep the current UI usable. */ }
  }, [key]);
  return [value, update] as const;
}
