import { useId, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Button, ButtonLink } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { AppBar, Chip, Notice, PageTitle, StickyFoot, Subtitle } from '../../components/ui';
import { cx } from '../../lib/cx';
import { useDocumentTitle } from '../../lib/hooks';
import { findListing, findOrder, findRestaurant, hasRating } from '../../store/selectors';
import { useStore } from '../../store/StoreProvider';
import type { FreshnessScore, RatingTag } from '../../types';
import { MissingPage } from '../MissingPage';

const SCORES: Array<{ value: FreshnessScore; meaning: string }> = [
  { value: 1, meaning: 'Nada fresco' },
  { value: 2, meaning: 'Poco fresco' },
  { value: 3, meaning: 'Normal' },
  { value: 4, meaning: 'Fresco' },
  { value: 5, meaning: 'Recién hecho' },
];

const TAGS: Array<{ value: RatingTag; label: string }> = [
  { value: 'was_warm', label: 'Estaba caliente' },
  { value: 'good_portion', label: 'Bien servido' },
  { value: 'same_as_in_store', label: 'Igual que en el local' },
];

export function Rate() {
  const { id } = useParams();
  const { db, actions } = useStore();
  const legendId = useId();
  const [score, setScore] = useState<FreshnessScore | null>(null);
  const [tags, setTags] = useState<RatingTag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  useDocumentTitle('Calificar frescura');

  const order = findOrder(db, id);
  const listing = findListing(db, order?.listingId);
  const restaurant = findRestaurant(db, listing?.restaurantId);
  if (!order || !listing || !restaurant) return <MissingPage backTo="/buyer/orders" title="No encontramos este pedido" />;

  if (sent) {
    return (
      <div className="pt-8 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-status-fresh text-success">
          <Icon name="check" className="h-7 w-7" strokeWidth={2.5} />
        </div>
        <PageTitle>¡Gracias!</PageTitle>
        <Subtitle>Tu calificación ayuda a otros estudiantes a elegir y a {restaurant.name} a mostrar que su comida es fresca.</Subtitle>
        <div className="flex flex-col gap-2">
          <ButtonLink block to="/buyer">
            Ver platos de hoy
          </ButtonLink>
          <ButtonLink block variant="ghost" to="/buyer/orders">
            Mis pedidos
          </ButtonLink>
        </div>
      </div>
    );
  }
  if (order.status !== 'picked_up' || hasRating({ db, orderId: order.id })) return <Navigate to={`/buyer/order/${order.id}`} replace />;

  const toggleTag = (tag: RatingTag) => setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]));

  const onSend = () => {
    if (score === null) {
      setError('Elige un número del 1 al 5.');
      return;
    }
    if (actions.rate({ orderId: order.id, score, tags }).ok) setSent(true);
  };

  return (
    <>
      <AppBar />
      <PageTitle>¿Qué tan fresco estaba tu {listing.title.toLowerCase()}?</PageTitle>
      <Subtitle>{restaurant.name} · ayuda al próximo comprador</Subtitle>

      <div role="group" aria-labelledby={legendId}>
        <p id={legendId} className="sr-only">
          Frescura del 1 al 5
        </p>
        <div className="mb-1 mt-3 grid grid-cols-5 gap-2">
          {SCORES.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-pressed={score === s.value}
              aria-label={`${s.value}, ${s.meaning}`}
              onClick={() => {
                setScore(s.value);
                setError(null);
              }}
              className={cx(
                'min-h-13 rounded-md border text-md font-extrabold',
                score === s.value ? 'border-inverse bg-inverse text-inverse' : 'border-input bg-surface text-primary hover:bg-surface-muted',
              )}
            >
              {s.value}
            </button>
          ))}
        </div>
        <p className="mb-4 flex justify-between text-xs text-secondary" aria-hidden="true">
          <span>Nada fresco</span>
          <span>Recién hecho</span>
        </p>
      </div>
      <div aria-live="polite">
        {error && (
          <Notice tone="low" icon="alert" className="mb-4">
            {error}
          </Notice>
        )}
      </div>

      <div role="group" aria-label="Algo más, opcional">
        <p className="mb-2 flex items-baseline justify-between font-extrabold">
          ¿Algo más? <span className="text-xs font-semibold text-secondary">opcional</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <Chip key={tag.value} pressed={tags.includes(tag.value)} onClick={() => toggleTag(tag.value)}>
              {tag.label}
            </Chip>
          ))}
        </div>
      </div>

      <StickyFoot>
        <Button block onClick={onSend}>
          Enviar
        </Button>
      </StickyFoot>
    </>
  );
}
