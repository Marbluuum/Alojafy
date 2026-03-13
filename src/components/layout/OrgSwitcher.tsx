import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Building2 } from 'lucide-react';
import { useAuth } from '../../lib/auth';

export default function OrgSwitcher() {
  const { organization, availableOrgs, switchOrg } = useAuth();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Only show switcher if user has more than 1 org
  if (!organization || availableOrgs.length <= 1) {
    return (
      <div className="min-w-0">
        <p className="text-sm font-bold text-white leading-tight">Alojafy</p>
        <p className="text-[10px] text-surface-500 leading-tight truncate">
          {organization?.name ?? 'Mi Complejo'}
        </p>
      </div>
    );
  }

  async function handleSwitch(orgId: string) {
    if (orgId === organization?.id || switching) return;
    setSwitching(true);
    setOpen(false);
    try {
      await switchOrg(orgId);
    } catch {
      setSwitching(false);
    }
  }

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button
        onClick={() => setOpen(!open)}
        disabled={switching}
        className="w-full text-left flex items-center gap-1 group disabled:opacity-70"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white leading-tight">Alojafy</p>
          <p className="text-[10px] text-surface-400 leading-tight truncate group-hover:text-surface-300 transition-colors">
            {switching ? 'Cambiando...' : (organization?.name ?? 'Mi Complejo')}
          </p>
        </div>
        <ChevronDown className={`w-3 h-3 text-surface-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-52 bg-surface-800 border border-white/10 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
          <p className="px-3 py-1.5 text-[10px] font-semibold text-surface-500 uppercase tracking-widest">
            Organizaciones
          </p>
          {availableOrgs.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSwitch(org.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/5 transition-colors"
            >
              <div className="w-6 h-6 rounded bg-primary-700/50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-3 h-3 text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{org.name}</p>
                <p className="text-[10px] text-surface-500 truncate capitalize">{org.plan}</p>
              </div>
              {org.id === organization?.id && (
                <Check className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
