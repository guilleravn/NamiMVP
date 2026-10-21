import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TabBar, type Tab } from '../../components/TabBar';
import { useRouteFocus } from '../../lib/hooks';
import { useStore } from '../../store/StoreProvider';

const TABS: Tab[] = [
  { to: '/buyer', label: 'Inicio', icon: 'home', end: true },
  { to: '/buyer/orders', label: 'Pedidos', icon: 'bag' },
];

/** Phone-first column (375–430 px). Tabs only on top-level screens; flows keep one focus. */
export function BuyerLayout() {
  const { session, actions } = useStore();
  const { pathname } = useLocation();
  useRouteFocus();

  // Deep links work without the landing: opening /buyer/... makes you the demo buyer.
  useEffect(() => {
    if (session?.role !== 'buyer') actions.chooseRole('buyer');
  }, [session, actions]);

  const showTabs = pathname === '/buyer' || pathname === '/buyer/orders';

  return (
    <div className="mx-auto flex min-h-[calc(100vh-44px)] w-full max-w-phone flex-col">
      <main id="main" className="flex-1 px-4 pb-6">
        <Outlet />
      </main>
      {showTabs && <TabBar tabs={TABS} label="Navegación del comprador" className="sticky bottom-0" />}
    </div>
  );
}
