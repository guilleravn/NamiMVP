import { NavLink } from 'react-router-dom';
import { cx } from '../lib/cx';
import { Icon, type IconName } from './Icon';

export interface Tab {
  to: string;
  label: string;
  icon: IconName;
  /** Match only the exact path (for index routes). */
  end?: boolean;
}

/** Navigation with icon + text. The active tab is marked with aria-current and a top bar, not only color. */
export function TabBar({ tabs, label, className }: { tabs: Tab[]; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={cx('border-t bg-surface', className)}>
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cx(
                  'relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-bold',
                  isActive ? 'text-action before:absolute before:inset-x-6 before:top-0 before:h-1 before:rounded-b-sm before:bg-action' : 'text-secondary hover:text-primary',
                )
              }
            >
              <Icon name={tab.icon} className="h-6 w-6" />
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
