import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';
import { Logo } from '../components/ui';
import { cx } from '../lib/cx';
import { useDocumentTitle } from '../lib/hooks';
import { useStore } from '../store/StoreProvider';
import type { UserRole } from '../types';

interface Side {
  role: UserRole;
  to: string;
  title: string;
  hint: string;
  icon: IconName;
  primary: boolean;
}

const SIDES: Side[] = [
  { role: 'buyer', to: '/buyer', title: 'Tengo hambre', hint: 'Comida de hoy cerca de la UCB, con 50–70% de descuento', icon: 'bag', primary: true },
  { role: 'restaurant_owner', to: '/restaurant', title: 'Tengo un restaurante', hint: 'Vende lo que te sobró hoy en menos de un minuto', icon: 'store', primary: false },
];

/** No real login: picking a side sets the role and a hardcoded demo user. */
export function Landing() {
  const { actions } = useStore();
  const navigate = useNavigate();
  useDocumentTitle('Comida del día con descuento');

  const choose = (side: Side) => {
    actions.chooseRole(side.role);
    navigate(side.to);
  };

  return (
    <main id="main" className="mx-auto flex min-h-[calc(100vh-44px)] w-full max-w-phone flex-col justify-center px-4 py-8">
      <Logo className="mb-6" />
      <h1 className="mb-2 font-display text-xl font-bold leading-tight">La comida buena de hoy no tiene que terminar en la basura.</h1>
      <p className="mb-8 text-md leading-relaxed text-secondary">
        Restaurantes de Cochabamba venden lo que les sobró del día, en buen estado, a mitad de precio o menos. Reservas, pagas con QR y lo retiras.
      </p>
      <div className="flex flex-col gap-3">
        {SIDES.map((side) => (
          <button
            key={side.role}
            type="button"
            onClick={() => choose(side)}
            className={cx(
              'flex min-h-20 items-center gap-4 rounded-lg px-4 py-4 text-left transition-colors',
              side.primary ? 'bg-action text-on-action hover:bg-action-hover' : 'border-2 border-action bg-surface text-action hover:bg-action-soft',
            )}
          >
            <Icon name={side.icon} className="h-8 w-8" />
            <span>
              <span className="block text-lg font-extrabold">{side.title}</span>
              <span className={cx('block text-sm', side.primary ? 'text-on-action' : 'text-secondary')}>{side.hint}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="mt-8 text-xs text-secondary">Demo sin backend: todos los datos son de prueba y se guardan solo en este navegador.</p>
    </main>
  );
}
