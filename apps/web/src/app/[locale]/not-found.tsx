import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-site flex flex-col items-center gap-6 py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="h-display text-5xl">Off the trail.</h1>
      <p className="text-mute">Page not found · Page introuvable · Seite nicht gefunden</p>
      <Link href="/" className="btn-primary">Vanguard Outdoor</Link>
    </div>
  );
}
