import Link from 'next/link';
import type { ProductSummary } from '@/lib/types';
import type { Dictionary, Locale } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { money, discountPct } from '@/lib/format';
import { ProductImage } from './ProductImage';
import { IconArrowUpRight, IconStar } from './icons';

export function ProductCard({ product, locale, dict, priority, as: Heading = 'h3' }: {
  product: ProductSummary; locale: Locale; dict: Dictionary; priority?: boolean;
  /** heading level of the title: h3 under a section heading, h2 straight under the page's h1 */
  as?: 'h2' | 'h3';
}) {
  const pct = discountPct(product.priceCents, product.compareAtCents);
  const range = product.maxPriceCents > product.priceCents;
  return (
    <Link href={`/${locale}/product/${product.slug}`} className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-4" prefetch={false}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-paper-100 ring-1 ring-inset ring-ink/5 transition-shadow duration-500 ease-smooth group-hover:shadow-lift">
        <ProductImage src={product.image} alt={product.title} category={product.category?.slug} priority={priority}
          className="transition-transform duration-[900ms] ease-smooth group-hover:scale-[1.06]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {pct > 0 && product.inStock && <span className="chip-signal">{t(dict.product.save, { pct })}</span>}
          {!product.inStock && <span className="chip-ink">{dict.product.soldOut}</span>}
        </div>
        <span aria-hidden="true"
          className="absolute bottom-2.5 right-2.5 grid h-8 w-8 translate-y-2 place-items-center rounded-full bg-white text-ink opacity-0 shadow-lift transition duration-300 ease-smooth group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
          <IconArrowUpRight width={15} height={15} />
        </span>
      </div>
      <div className="mt-3 space-y-1 px-0.5">
        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">
          <span className="truncate">{product.brandName}</span>
          {product.rating ? (
            <span className="flex shrink-0 items-center gap-1 text-ink"><IconStar width={12} height={12} className="text-signal" />{product.rating.toFixed(1)}</span>
          ) : null}
        </div>
        <Heading className="text-[14.5px] font-semibold leading-snug text-ink transition-colors duration-200 group-hover:text-moss-600">{product.title}</Heading>
        <p className="flex flex-wrap items-baseline gap-x-2 text-[14.5px]">
          <span className={`tabular-nums ${pct > 0 ? 'font-bold text-signal' : 'font-bold text-ink'}`}>
            {range && <span className="mr-1 text-xs font-medium text-mute">{dict.product.from}</span>}
            {money(product.priceCents, locale)}
          </span>
          {pct > 0 && <s className="text-sm tabular-nums text-mute">{money(product.compareAtCents!, locale)}</s>}
        </p>
      </div>
    </Link>
  );
}
