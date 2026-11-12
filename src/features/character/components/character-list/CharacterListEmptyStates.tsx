import { UserPlusIcon } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/Button';

/** Nessun risultato per i filtri correnti. */
export const NoFilterResults = ({ onReset }: { onReset: () => void }) => (
  <div className="rounded-2xl border border-border/60 bg-card/50 px-6 py-14 text-center">
    <p className="font-semibold text-foreground">Nessun eroe corrisponde ai filtri</p>
    <p className="mt-1 text-sm text-muted-foreground">Prova un'altra ricerca o un'altra campagna.</p>
    <Button variant="secondary" size="sm" className="mt-5" onClick={onReset}>
      Azzera filtri
    </Button>
  </div>
);

/** Invito a creare il primo personaggio. */
export const FirstHeroPrompt = ({ isLoggedIn, onCreate }: { isLoggedIn: boolean; onCreate: () => void }) => (
  <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-16 text-center sm:py-20">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgb(var(--color-accent)/0.18),transparent_60%)]" />
    <div className="relative mx-auto max-w-md">
      <div className="mx-auto mb-6 flex h-16 w-16 rotate-45 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10">
        <span className="-rotate-45 font-norse text-3xl text-accent">R</span>
      </div>
      <h2 className="font-cinzel text-2xl font-bold text-foreground">La tua avventura inizia qui</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {isLoggedIn
          ? 'Non hai ancora personaggi su questo account.'
          : 'Non hai personaggi salvati su questo dispositivo. Accedi per sincronizzarli tra i tuoi dispositivi.'}
      </p>
      <Button size="lg" className="mt-8" onClick={onCreate}>
        <UserPlusIcon className="h-4 w-4" /> Crea il tuo primo eroe
      </Button>
    </div>
  </div>
);
