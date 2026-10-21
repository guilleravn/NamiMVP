import { useId, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Field, FieldError, inputClass } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { Photo } from '../../components/Photo';
import { BackButton, Notice, PageTitle } from '../../components/ui';
import { cx } from '../../lib/cx';
import { discountPercent } from '../../lib/format';
import { useDocumentTitle } from '../../lib/hooks';
import { toHHMM } from '../../lib/time';
import { PHOTOS } from '../../mocks/photos';
import { MAX_DISCOUNT, MIN_DISCOUNT, type ListingErrors, type ListingField, type ListingInput } from '../../store/listingInput';
import { findListing } from '../../store/selectors';
import { useStore } from '../../store/StoreProvider';
import { PHOTO_KEYS, type Listing, type ListingFormat, type PhotoKey } from '../../types';
import { MissingPage } from '../MissingPage';
import { useOwnRestaurant } from './useOwnRestaurant';

/** Form state: everything as typed, converted to numbers only on submit. */
interface FormValues {
  format: ListingFormat;
  title: string;
  description: string;
  photo: PhotoKey;
  portionsTotal: string;
  preparedAt: string;
  regularPrice: string;
  price: string;
  pickupStart: string;
  pickupEnd: string;
}

const EMPTY: FormValues = {
  format: 'dish',
  title: '',
  description: '',
  photo: 'silpancho',
  portionsTotal: '3',
  preparedAt: '12:30',
  regularPrice: '',
  price: '',
  pickupStart: '15:00',
  pickupEnd: '16:30',
};

function fromListing(listing: Listing): FormValues {
  return {
    format: listing.format,
    title: listing.title,
    description: listing.description,
    photo: listing.photo,
    portionsTotal: String(listing.portionsTotal),
    preparedAt: toHHMM(listing.preparedAt),
    regularPrice: String(listing.regularPrice),
    price: String(listing.price),
    pickupStart: toHHMM(listing.pickupStart),
    pickupEnd: toHHMM(listing.pickupEnd),
  };
}

/** Empty text becomes NaN so validation reports it as missing. */
function toNumber(text: string): number {
  return text.trim() === '' ? Number.NaN : Number(text.replace(',', '.'));
}

function toInput(values: FormValues): ListingInput {
  return {
    ...values,
    portionsTotal: toNumber(values.portionsTotal),
    regularPrice: toNumber(values.regularPrice),
    price: toNumber(values.price),
  };
}

const FORMATS: ListingFormat[] = ['dish', 'surprise_bag'];

/** Field order on screen, to focus the first error. */
const FIELD_ORDER: ListingField[] = ['title', 'portionsTotal', 'preparedAt', 'regularPrice', 'price', 'pickupStart', 'pickupEnd'];

export function ListingForm() {
  const { id } = useParams();
  const { db } = useStore();
  const editing = id !== undefined;
  const listing = editing ? findListing(db, id) : undefined;
  const restaurant = useOwnRestaurant();
  useDocumentTitle(editing ? 'Editar publicación' : 'Publicar sobras');

  if (editing && (!listing || listing.restaurantId !== restaurant.id)) {
    return <MissingPage backTo="/restaurant" title="No encontramos esta publicación" />;
  }
  return <ListingFormScreen key={id ?? 'new'} listing={listing} />;
}

function ListingFormScreen({ listing }: { listing: Listing | undefined }) {
  const { actions } = useStore();
  const restaurant = useOwnRestaurant();
  const navigate = useNavigate();
  const formId = useId();
  const [values, setValues] = useState<FormValues>(() => (listing ? fromListing(listing) : EMPTY));
  const [errors, setErrors] = useState<ListingErrors>({});

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    // Clear a field's error as soon as it's edited.
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const fieldId = (field: ListingField) => `${formId}-${field}`;

  const regular = toNumber(values.regularPrice);
  const price = toNumber(values.price);
  const showDiscount = Number.isFinite(regular) && Number.isFinite(price) && regular > 0 && price > 0;
  const percent = showDiscount ? discountPercent({ regularPrice: regular, price }) : 0;
  const discountOk = percent >= MIN_DISCOUNT * 100 && percent <= MAX_DISCOUNT * 100;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const input = toInput(values);
    const result = listing
      ? actions.editListing({ listingId: listing.id, input })
      : actions.postListing({ restaurantId: restaurant.id, input });
    if (result.ok) {
      navigate('/restaurant');
      return;
    }
    if (result.error === 'invalid') {
      setErrors(result.errors);
      const first = FIELD_ORDER.find((f) => result.errors[f] !== undefined);
      if (first) document.getElementById(fieldId(first))?.focus();
    }
  };

  const isBag = values.format === 'surprise_bag';
  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-xl">
      <BackButton to="/restaurant" label="Volver a publicaciones de hoy" />
      <PageTitle className="mb-4">{listing ? 'Editar publicación' : '¿Qué te sobró hoy?'}</PageTitle>

      <form onSubmit={onSubmit} noValidate aria-describedby={errorCount > 0 ? `${formId}-summary` : undefined}>
        <div role="group" aria-label="Formato" className="mb-4 grid grid-cols-2 gap-1 rounded-md bg-surface-muted p-1">
          {FORMATS.map((format) => (
            <button
              key={format}
              type="button"
              aria-pressed={values.format === format}
              onClick={() => set('format', format)}
              className={cx(
                'min-h-target rounded-sm font-bold',
                values.format === format ? 'bg-surface text-primary shadow-card' : 'text-secondary hover:text-primary',
              )}
            >
              {format === 'dish' ? 'Plato concreto' : 'Bolsa sorpresa'}
            </button>
          ))}
        </div>

        <Field
          id={fieldId('title')}
          label={isBag ? 'Qué puede traer la bolsa' : 'Plato'}
          placeholder={isBag ? 'Pan, empanadas o masitas del día' : 'Silpancho'}
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          error={errors.title}
          autoComplete="off"
        />

        <div className="mb-3">
          <label htmlFor={fieldId('description')} className="mb-1 block text-xs font-bold text-secondary">
            Descripción <span className="font-normal">(opcional)</span>
          </label>
          <textarea
            id={fieldId('description')}
            rows={2}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Arroz, papa, carne apanada, huevo y ensalada."
            className={cx(inputClass, 'py-2')}
          />
        </div>

        <fieldset className="mb-3">
          <legend className="mb-1 text-xs font-bold text-secondary">Foto</legend>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {PHOTO_KEYS.map((key) => (
              <label key={key} className="relative cursor-pointer">
                <input
                  type="radio"
                  name={`${formId}-photo`}
                  value={key}
                  checked={values.photo === key}
                  onChange={() => set('photo', key)}
                  className="peer sr-only"
                />
                <Photo
                  photo={key}
                  alt=""
                  className="aspect-square w-full rounded-md border-2 border-transparent peer-checked:border-inverse peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
                />
                <span className="sr-only">{PHOTOS[key].label}</span>
                {values.photo === key && (
                  <span aria-hidden="true" className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-inverse text-inverse">
                    <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <Field
            id={fieldId('portionsTotal')}
            label={isBag ? 'Bolsas' : 'Porciones'}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={values.portionsTotal}
            onChange={(e) => set('portionsTotal', e.target.value)}
            error={errors.portionsTotal}
            className="num"
          />
          <Field
            id={fieldId('preparedAt')}
            label={isBag ? 'Horneado / hecho a las' : 'Preparado a las'}
            type="time"
            value={values.preparedAt}
            onChange={(e) => set('preparedAt', e.target.value)}
            error={errors.preparedAt}
            className="num"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            id={fieldId('regularPrice')}
            label={isBag ? 'Valor normal aprox.' : 'Precio normal'}
            prefix="Bs"
            type="number"
            inputMode="decimal"
            min={1}
            placeholder="35"
            value={values.regularPrice}
            onChange={(e) => set('regularPrice', e.target.value)}
            error={errors.regularPrice}
            className="num"
          />
          <Field
            id={fieldId('price')}
            label="Precio en Ñami"
            prefix="Bs"
            type="number"
            inputMode="decimal"
            min={1}
            placeholder="14"
            value={values.price}
            onChange={(e) => set('price', e.target.value)}
            error={errors.price}
            className="num"
            hint={
              <span aria-live="polite" className={cx('font-bold', showDiscount && (discountOk ? 'text-status-fresh' : 'text-status-low'))}>
                {showDiscount ? (
                  <>
                    <span className="num">−{percent}%</span>
                    {discountOk ? ' de descuento' : errors.price ? '' : ' · debe ser entre 30% y 70%'}
                  </>
                ) : (
                  <span className="font-normal text-secondary">Entre 30% y 70% menos que el normal</span>
                )}
              </span>
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            id={fieldId('pickupStart')}
            label="Retiro desde"
            type="time"
            value={values.pickupStart}
            onChange={(e) => set('pickupStart', e.target.value)}
            error={errors.pickupStart}
            className="num"
          />
          <Field
            id={fieldId('pickupEnd')}
            label="Retiro hasta"
            type="time"
            value={values.pickupEnd}
            onChange={(e) => set('pickupEnd', e.target.value)}
            error={errors.pickupEnd}
            className="num"
          />
        </div>

        <Notice tone="fresh" icon="shield" className="mb-4 text-xs font-semibold">
          Se muestra solo después de tu hora pico (<span className="num">{restaurant.rushHourEndsAt}</span>) y en porciones limitadas, para que tus
          clientes de siempre no esperen el descuento.
        </Notice>

        {errorCount > 0 && (
          <div className="mb-3">
            <FieldError id={`${formId}-summary`}>
              {errorCount === 1 ? 'Revisa 1 campo marcado arriba.' : `Revisa ${errorCount} campos marcados arriba.`}
            </FieldError>
          </div>
        )}
        <Button type="submit" block>
          {listing ? 'Guardar cambios' : 'Publicar'}
        </Button>
      </form>
    </div>
  );
}
