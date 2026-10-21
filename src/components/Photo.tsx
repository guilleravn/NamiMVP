import { useState } from 'react';
import { cx } from '../lib/cx';
import { PHOTOS } from '../mocks/photos';
import type { PhotoKey } from '../types';

interface PhotoProps {
  photo: PhotoKey;
  /** Empty string when the dish name is already right next to the photo. */
  alt: string;
  className?: string;
}

/** Bundled food photo. Until the real file exists in public/img, shows an emoji placeholder. */
export function Photo(props: PhotoProps) {
  // Keyed so a failed photo doesn't stick when the photo changes (e.g. in the post form).
  return <PhotoInner key={props.photo} {...props} />;
}

function PhotoInner({ photo, alt, className }: PhotoProps) {
  const [failed, setFailed] = useState(false);
  const info = PHOTOS[photo];

  if (failed) {
    return (
      <div
        className={cx('grid place-items-center bg-surface-muted', className)}
        {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}
      >
        <span aria-hidden="true" className="text-xl">
          {info.emoji}
        </span>
      </div>
    );
  }
  return <img src={info.src} alt={alt} onError={() => setFailed(true)} className={cx('bg-surface-muted object-cover', className)} />;
}
