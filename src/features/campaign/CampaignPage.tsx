import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { useCampaigns } from '../../providers/CampaignProvider';
import * as campaignService from '../../services/campaignService';
import { describeDataError } from '../../lib/errors';
import { confirmDialog, toast } from '../../components/ui/Dialogs';
import { ArrowLeftIcon } from '../../components/ui/icons';
import type { ICampaignMember, ISharedCharacter } from '../character/characterTypes';
import { getRole } from '../character/rules/campaign';
import { CampaignHeader } from './components/CampaignHeader';
import { MemberList } from './components/MemberList';
import { SharedCharacterCard } from './components/SharedCharacterCard';

const Notice = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto max-w-xl space-y-4 p-8 text-center text-muted-foreground">
    {children}
    <Link to="/" className="inline-block text-sm font-semibold text-accent hover:underline">Torna ai tuoi eroi</Link>
  </div>
);

export const CampaignPage = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { campaigns, loading } = useCampaigns();
  const [members, setMembers] = useState<ICampaignMember[]>([]);
  const [shared, setShared] = useState<ISharedCharacter[]>([]);
  const [error, setError] = useState<string | null>(null);

  const uid = currentUser?.uid ?? null;
  const campaign = campaigns.find((c) => c.id === campaignId);
  const role = campaign ? getRole(campaign, uid) : null;
  const isMember = !!campaign && !!role;

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

  if (!uid) {
    return (
      <Notice>
        <p>Accedi per vedere le campagne condivise.</p>
        <Link to="/login" className="inline-block rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">Accedi</Link>
      </Notice>
    );
  }
  if (loading) return <p className="p-8 text-center text-sm text-muted-foreground">Caricamento campagna…</p>;
  if (!campaign || !role || !campaignId) {
    return <Notice><p>Campagna non trovata, oppure non ne fai parte.</p></Notice>;
  }

  const ownerNames = new Map(members.map((m) => [m.uid, m.displayName]));

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
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent">
        <ArrowLeftIcon className="h-4 w-4" /> I tuoi eroi
      </Link>

      <CampaignHeader
        key={campaign.updatedAt}
        campaign={campaign}
        role={role}
        onSave={(name, description) => guard(() => campaignService.updateCampaignDetails(campaign.id, name, description), 'Impossibile salvare le modifiche.')}
        onRegenerateCode={async () => {
          const ok = await confirmDialog({
            title: 'Generare un nuovo codice?',
            message: 'Il codice attuale smetterà di funzionare. Chi è già nella campagna non viene toccato.',
            confirmLabel: 'Genera',
          });
          if (ok) await guard(async () => { await campaignService.regenerateInviteCode(campaign); }, 'Impossibile generare il codice.');
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

      <section aria-labelledby="party-title" className="space-y-3">
        <h2 id="party-title" className="font-cinzel text-xl font-bold text-foreground">Il gruppo</h2>
        {shared.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nessun personaggio condiviso. Per comparire qui, associa un personaggio a questa campagna dall'editor e salvalo.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shared.map((c) => (
              <SharedCharacterCard key={c.id} character={c} ownerName={ownerNames.get(c.ownerUid)} isMine={c.ownerUid === uid} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="members-title" className="space-y-3">
        <h2 id="members-title" className="font-cinzel text-xl font-bold text-foreground">Membri ({members.length})</h2>
        <MemberList members={members} currentUid={uid} canManage={role === 'dm'} onRemove={handleRemoveMember} />
      </section>
    </div>
  );
};
