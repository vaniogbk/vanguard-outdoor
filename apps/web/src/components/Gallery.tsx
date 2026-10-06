'use client';

import { useState } from 'react';
import { ProductImage } from './ProductImage';

/**
 * Main photo + thumbnails. Thumbnails scroll horizontally under the photo on phones and sit in a vertical rail beside it
 * from `md` up — the rail is taken out of the flow (absolute) so a product with 12 photos never stretches the grid
 * and squeezes the purchase column.
 */
export function Gallery({ images, title, category }: { images: string[]; title: string; category?: string | null }) {
  const [active, setActive] = useState(0);
  const list = images.length ? images : [null];
  const multi = list.length > 1;
  return (
    <div className="min-w-0 md:grid md:grid-cols-[4.25rem_minmax(0,1fr)] md:gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-paper-100 ring-1 ring-inset ring-ink/5 md:order-2 md:aspect-[4/5]">
        <div key={String(list[active])} className="absolute inset-0 animate-fade-in">
          <ProductImage src={list[active]} alt={title} category={category} sizes="(min-width: 1024px) 50vw, 100vw" priority />
        </div>
        {multi && <span className="chip-glass absolute bottom-3 right-3 bg-ink/45 tabular-nums md:hidden" aria-hidden="true">{active + 1} / {list.length}</span>}
      </div>
      {multi && (
        <div className="relative mt-2.5 md:order-1 md:mt-0">
          <ul className="no-scrollbar flex snap-x gap-2 overflow-x-auto p-0.5 md:absolute md:inset-0 md:flex-col md:overflow-x-hidden md:overflow-y-auto">
            {list.map((src, i) => (
              <li key={i} className="shrink-0 snap-start md:w-full">
                <button type="button" onClick={() => setActive(i)} aria-label={`${title} ${i + 1}`} aria-current={i === active ? 'true' : undefined}
                  className={`relative block h-[4.5rem] w-14 overflow-hidden rounded-xl bg-paper-100 transition duration-200 ease-smooth md:h-[5.25rem] md:w-full ${i === active ? 'ring-2 ring-ink ring-offset-2' : 'opacity-60 hover:opacity-100'}`}>
                  <ProductImage src={src} alt="" category={category} sizes="64px" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
