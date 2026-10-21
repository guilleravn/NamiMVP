import { PageTitle, Subtitle } from '../../components/ui';
import { formatBs } from '../../lib/format';
import { useDocumentTitle } from '../../lib/hooks';
import { relativeDay } from '../../lib/time';
import { weekStats } from '../../store/selectors';
import { useStore } from '../../store/StoreProvider';
import { useOwnRestaurant } from './useOwnRestaurant';

export function Stats() {
  const { db, now } = useStore();
  const restaurant = useOwnRestaurant();
  useDocumentTitle('Estadísticas');
  const stats = weekStats({ db, restaurantId: restaurant.id, now });

  return (
    <>
      <PageTitle>Esta semana</PageTitle>
      <Subtitle>Últimos 7 días, incluido hoy.</Subtitle>

      <section aria-label="Platos rescatados" className="mb-3 rounded-lg border bg-surface p-4">
        <p className="font-semibold text-secondary">Platos rescatados</p>
        <p className="num my-1 text-xl font-extrabold text-success">{stats.dishesRescued}</p>
        <p className="text-xs text-secondary">Pedidos que alguien compró y retiró: comida que no terminó en la basura.</p>
      </section>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <section aria-label="Dinero recuperado" className="rounded-lg border bg-surface p-4">
          <p className="font-semibold text-secondary">Dinero recuperado</p>
          <p className="num my-1 text-lg font-extrabold">{formatBs(stats.recovered)}</p>
          <p className="num text-xs text-secondary">
            Ventas {formatBs(stats.sales)} − comisión {formatBs(stats.fees)}
          </p>
        </section>
        <section aria-label="Vendido de lo publicado" className="rounded-lg border bg-surface p-4">
          <p className="font-semibold text-secondary">Vendido de lo publicado</p>
          <p className="num my-1 text-lg font-extrabold">{stats.sellThrough}%</p>
          <p className="num text-xs text-secondary">
            {stats.sold} de {stats.posted} porciones
          </p>
        </section>
      </div>

      <h2 id="per-day" className="mb-2 font-extrabold">
        Platos rescatados por día
      </h2>
      <div className="overflow-hidden rounded-lg border bg-surface">
      <table aria-labelledby="per-day" className="w-full text-left">
        <thead>
          <tr className="border-b text-xs uppercase tracking-wide text-secondary">
            <th scope="col" className="px-4 py-2 font-bold">
              Día
            </th>
            <th scope="col" className="px-4 py-2 text-right font-bold">
              Rescatados
            </th>
          </tr>
        </thead>
        <tbody>
          {stats.days.map(({ day, rescued }) => (
            <tr key={day.toISOString()} className="border-b last:border-b-0">
              <th scope="row" className="px-4 py-2 font-semibold capitalize">
                {relativeDay({ iso: day.toISOString(), now })}
              </th>
              <td className="num px-4 py-2 text-right font-bold">{rescued}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}
