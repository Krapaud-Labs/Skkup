import Image from "next/image";
import Link from "next/link";

interface EnteteVitrineProps {
  actionHref: string;
  actionLabel: string;
}

/** Header public partagé par la vitrine et les parcours d'authentification. */
export function EnteteVitrine({
  actionHref,
  actionLabel,
}: EnteteVitrineProps) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
      <Link href="/" className="skuup-logo" aria-label="Accueil Skuup">
        <Image
          src="/images/skuup-logo.png"
          alt="SKUUP"
          width={164}
          height={42}
          priority
        />
      </Link>
      <nav
        className="hidden items-center gap-8 text-sm text-white/80 md:flex"
        aria-label="Navigation vitrine"
      >
        <Link href="/#fonctionnement">Comment ça marche</Link>
        <Link href="/#lots">Lots partenaires</Link>
        <Link href="/#engagement">Le projet</Link>
        <Link href="/faq">FAQ</Link>
      </nav>
      <Link href={actionHref} className="skuup-button skuup-button-small">
        {actionLabel}
      </Link>
    </header>
  );
}
