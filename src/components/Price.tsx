import { cx } from '../lib/cx';
import { formatBs } from '../lib/format';
import type { Listing } from '../types';

/** Ñami price big, regular price struck through below. Bags show "~" since their value is approximate. */
export function Price({ listing, className }: { listing: Pick<Listing, 'price' | 'regularPrice' | 'format'>; className?: string }) {
  const approx = listing.format === 'surprise_bag' ? '~' : '';
  return (
    <p className={cx('num whitespace-nowrap text-right leading-tight', className)}>
      <span className="sr-only">Precio en Ñami: </span>
      <b className="block text-lg font-extrabold">{formatBs(listing.price)}</b>
      <span className="sr-only">, precio normal: </span>
      <s className="text-xs text-secondary">
        {approx}
        {formatBs(listing.regularPrice)}
      </s>
    </p>
  );
}
