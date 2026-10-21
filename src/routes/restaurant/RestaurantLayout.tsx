import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { TabBar, type Tab } from '../../components/TabBar';
import { AppBar } from '../../components/ui';
import { useRouteFocus } from '../../lib/hooks';
import { useStore } from '../../store/StoreProvider';

const TABS: Tab[] = [
  { to: '/restaurant', label: 'Hoy', icon: 'list', end: true },
  { to: '/restaurant/orders', label: 'Pedidos', icon: 'bag' },
  { to: '/restaurant/stats', label: 'Estadísticas', icon: 'chart' },
];

/** Works on a phone and on the counter tablet/laptop: tabs at the bottom on phones, on top from 640 px. */
export function RestaurantLayout() {
  const { session, actions, ownRestaurant } = useStore();
  useRouteFocus();

  useEffect(() => {
    if (session?.role !== 'restaurant_owner') actions.chooseRole('restaurant_owner');
  }, [session, actions]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-44px)] w-full max-w-4xl flex-col">
      <div className="px-4 sm:px-6">
        <AppBar>
          Restaurante
          <b className="block text-sm text-primary">{ownRestaurant?.name ?? '—'}</b>
        </AppBar>
      </div>
      <TabBar
        tabs={TABS}
        label="Navegación del restaurante"
        className="sticky bottom-0 order-last sm:static sm:order-none sm:mb-4 sm:rounded-lg sm:border sm:mx-6"
      />
      <main id="main" className="flex-1 px-4 pb-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
