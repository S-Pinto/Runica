import { RuneMarkIcon, UserPlusIcon } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/Button';

/** Nessun risultato per i filtri correnti. */
export const NoFilterResults = ({ onReset }: { onReset: () => void }) => (
  <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
    <p className="font-semibold text-foreground">Nessun eroe corrisponde ai filtri</p>
    <p className="mt-1 text-sm text-muted-foreground">Prova un'altra ricerca o un'altra campagna.</p>
    <Button variant="secondary" className="mt-5" onClick={onReset}>
      Azzera filtri
    </Button>
  </div>
);

/** Invito a creare il primo personaggio: l'unica azione primaria della pagina vuota. */
export const FirstHeroPrompt = ({ isLoggedIn, onCreate }: { isLoggedIn: boolean; onCreate: () => void }) => (
  <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center sm:py-20">
    <div className="mx-auto max-w-md">
      <div className="mx-auto mb-7 flex h-14 w-14 rotate-45 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10 text-accent">
        <RuneMarkIcon className="h-7 w-7 -rotate-45" />
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
