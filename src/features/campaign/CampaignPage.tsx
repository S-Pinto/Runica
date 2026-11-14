import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { useCampaigns } from '../../providers/CampaignProvider';
import * as campaignService from '../../services/campaignService';
import { describeDataError } from '../../lib/errors';
import { confirmDialog, toast } from '../../components/ui/Dialogs';
import { Button } from '../../components/ui/Button';
import { ArrowLeftIcon } from '../../components/ui/icons';
import type { ICampaign, ICampaignMember, ILiveStats, ISharedCharacter } from '../character/characterTypes';
import { canReadPartyLiveStats, getRole } from '../character/rules/campaign';
import { CampaignHeader } from './components/CampaignHeader';
import { MemberList } from './components/MemberList';
import { SharedCharacterCard } from './components/SharedCharacterCard';
import { CharacterPickerModal } from './components/CharacterPickerModal';

const Notice = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto max-w-xl space-y-5 px-4 py-16 text-center text-muted-foreground">
    {children}
    <Link to="/" className="inline-block text-sm font-semibold text-accent underline-offset-4 hover:underline">Torna ai tuoi eroi</Link>
  </div>
);

/** `undefined` = in attesa del primo snapshot, `null` = non esiste o non si è membri. */
type CampaignState = ICampaign | null | undefined;

export const CampaignPage = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { campaigns } = useCampaigns();
  const [direct, setDirect] = useState<CampaignState>(undefined);
  const [members, setMembers] = useState<ICampaignMember[]>([]);
  const [shared, setShared] = useState<ISharedCharacter[]>([]);
  const [live, setLive] = useState<ILiveStats[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(() => !!(location.state as { pickCharacter?: boolean } | null)?.pickCharacter);

  const uid = currentUser?.uid ?? null;
  // L'elenco in tempo reale arriva dal provider; subito dopo l'unione può non averla ancora, quindi
  // si ascolta anche il documento della campagna direttamente.
  const campaign: CampaignState = campaigns.find((c) => c.id === campaignId) ?? direct;
  const role = campaign ? getRole(campaign, uid) : null;
  const isMember = !!campaign && !!role;
  const liveScope = campaign && role ? (canReadPartyLiveStats(campaign, role) ? 'party' : 'own') : null;

  useEffect(() => {
    if (!campaignId || !uid) return;
    setDirect(undefined);
    return campaignService.onCampaignSnapshot(campaignId, setDirect, (e) => {
      setDirect(null);
      setError(describeDataError(e, 'Impossibile caricare la campagna.'));
    });
  }, [campaignId, uid]);

  useEffect(() => {
    if (!campaignId || !isMember) return;
    setError(null);
    const fail = (e: unknown) => setError(describeDataError(e, 'Impossibile caricare i dati della campagna.'));
    const stopMembers = campaignService.onCampaignMembersSnapshot(campaignId, setMembers, fail);
    const stopShared = campaignService.onSharedCharactersSnapshot(campaignId, setShared, fail);
    return () => {
      stopMembers();
      stopShared();
    };
  }, [campaignId, isMember]);

  // Numeri dal vivo: tutto il gruppo (DM, o giocatore in modalità numerica) oppure solo i propri.
  useEffect(() => {
    if (!campaignId || !liveScope || !uid) return;
    setLive([]);
    return campaignService.onLiveStatsSnapshot(campaignId, liveScope === 'own' ? uid : null, setLive, (e) => {
      console.warn('Numeri dal vivo non disponibili', e);
    });
  }, [campaignId, liveScope, uid]);

  if (!uid) {
    return (
      <Notice>
        <p>Accedi per vedere le campagne condivise.</p>
        <p>
          <Link to={`/login?next=${encodeURIComponent(location.pathname)}`} className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-rest transition-colors duration-150 hover:bg-accent-dark">Accedi</Link>
        </p>
      </Notice>
    );
  }
  if (campaign === undefined) return <p className="p-8 text-center text-sm text-muted-foreground">Caricamento campagna…</p>;
  if (!campaign || !role || !campaignId) {
    return <Notice><p>Campagna non trovata, oppure non ne fai parte.</p></Notice>;
  }

  const ownerNames = new Map(members.map((m) => [m.uid, m.displayName]));
  const liveById = new Map(live.map((s) => [s.id, s]));
  const hasOwnCharacter = shared.some((c) => c.ownerUid === uid);

  const guard = async (action: () => Promise<void>, failure: string) => {
    try {
      await action();
    } catch (e) {
      toast.error(describeDataError(e, failure));
    }
  };

  const handleRemoveMember = async (member: ICampaignMember) => {
    const ok = await confirmDialog({
      title: `Rimuovere ${member.displayName}?`,
      message: 'Il giocatore esce dalla campagna e i suoi personaggi non saranno più visibili qui. Le sue schede non vengono toccate.',
      confirmLabel: 'Rimuovi',
      destructive: true,
    });
    if (ok) await guard(() => campaignService.removeMember(campaign.id, member.uid), 'Impossibile rimuovere il giocatore.');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:px-6 sm:py-8">
      <Link to="/" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground">
        <ArrowLeftIcon className="h-4 w-4" /> I tuoi eroi
      </Link>

      <CampaignHeader
        key={campaign.updatedAt}
        campaign={campaign}
        role={role}
        onSave={(name, description) => guard(() => campaignService.updateCampaignDetails(campaign, name, description), 'Impossibile salvare le modifiche.')}
        onRegenerateCode={async () => {
          const ok = await confirmDialog({
            title: 'Generare un nuovo codice?',
            message: 'Il codice e il link attuali smetteranno di funzionare. Chi è già nella campagna non viene toccato.',
            confirmLabel: 'Genera',
          });
          if (ok) {
            await guard(async () => {
              await campaignService.regenerateInviteCode(campaign, currentUser?.displayName || '');
            }, 'Impossibile generare il codice.');
          }
        }}
        onDelete={async () => {
          const ok = await confirmDialog({
            title: `Eliminare "${campaign.name}"?`,
            message: 'La campagna e i riepiloghi condivisi spariranno per tutti i membri. Le schede dei giocatori restano al loro posto. Non si può annullare.',
            confirmLabel: 'Elimina campagna',
            destructive: true,
          });
          if (!ok) return;
          await guard(async () => {
            await campaignService.deleteCampaign(campaign);
            toast.success('Campagna eliminata.');
            navigate('/');
          }, 'Impossibile eliminare la campagna.');
        }}
        onLeave={async () => {
          const ok = await confirmDialog({
            title: 'Abbandonare la campagna?',
            message: 'I tuoi personaggi non saranno più visibili ai membri. Le schede restano tue.',
            confirmLabel: 'Abbandona',
            destructive: true,
          });
          if (!ok) return;
          await guard(async () => {
            await campaignService.leaveCampaign(campaign.id, uid);
            toast.success('Hai lasciato la campagna.');
            navigate('/');
          }, 'Impossibile lasciare la campagna.');
        }}
      />

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {role === 'player' && !hasOwnCharacter && (
        <div className="tile flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="font-cinzel text-title text-foreground">Con chi siedi al tavolo?</p>
            <p className="text-sm text-muted-foreground">Associa uno dei tuoi eroi: il DM e il gruppo lo vedranno qui, aggiornato mentre giochi.</p>
          </div>
          <Button onClick={() => setPickerOpen(true)}>Scegli il personaggio</Button>
        </div>
      )}

      <section aria-labelledby="party-title" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="party-title" className="font-cinzel text-headline text-foreground">Il gruppo</h2>
          {role === 'player' && hasOwnCharacter && (
            <Button variant="ghost" size="sm" onClick={() => setPickerOpen(true)}>Cambia personaggio</Button>
          )}
        </div>
        {shared.length === 0 ? (
          <p className="surface p-6 text-center text-sm text-muted-foreground">
            {role === 'dm'
              ? 'Nessun personaggio ancora. Condividi il link d\'invito: chi entra sceglie il proprio eroe e compare qui.'
              : 'Nessun personaggio condiviso per ora.'}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {shared.map((c) => (
              <SharedCharacterCard key={c.id} character={c} live={liveById.get(c.id)} ownerName={ownerNames.get(c.ownerUid)} isMine={c.ownerUid === uid} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="members-title" className="space-y-3">
        <h2 id="members-title" className="font-cinzel text-headline text-foreground">Membri ({members.length})</h2>
        <MemberList members={members} currentUid={uid} canManage={role === 'dm'} onRemove={handleRemoveMember} />
      </section>

      {role === 'player' && (
        <CharacterPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} campaign={campaign} />
      )}
    </div>
  );
};
