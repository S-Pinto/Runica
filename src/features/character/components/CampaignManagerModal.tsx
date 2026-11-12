import { useState } from 'react';
import { XMarkIcon, UserGroupIcon } from '../../../components/ui/icons';
import { confirmDialog, toast } from '../../../components/ui/Dialogs';
import { useAuth } from '../../../providers/AuthProvider';
import { useCampaigns } from '../../../providers/CampaignProvider';
import * as campaignService from '../../../services/campaignService';
import { describeDataError } from '../../../lib/errors';
import { useCharacter } from '../CharacterProvider';
import type { ILocalCampaign } from '../characterTypes';
import { CampaignListTab, type CampaignChoice } from './campaign/CampaignListTab';
import { CampaignCreateForm } from './campaign/CampaignCreateForm';
import { CampaignJoinForm } from './campaign/CampaignJoinForm';

interface CampaignManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCampaign?: (campaign: CampaignChoice | null) => void;
  selectedCampaignId?: string;
}

type Tab = 'list' | 'create' | 'join';

export const CampaignManagerModal = ({ isOpen, onClose, onSelectCampaign, selectedCampaignId }: CampaignManagerModalProps) => {
  const { currentUser } = useAuth();
  const { campaigns, localCampaigns, loading, loadError, refreshLocalCampaigns } = useCampaigns();
  const { characters, saveCharacter } = useCharacter();
  const [activeTab, setActiveTab] = useState<Tab>('list');

  if (!isOpen) return null;

  const uid = currentUser?.uid ?? null;
  const user = currentUser
    ? { uid: currentUser.uid, displayName: currentUser.displayName || currentUser.email || 'Giocatore', photoURL: currentUser.photoURL }
    : null;

  const handleCreate = async (name: string, description: string) => {
    try {
      const created = user
        ? await campaignService.createCampaign(user, name, description)
        : campaignService.createLocalCampaign(name, description);
      if (!user) refreshLocalCampaigns();
      setActiveTab('list');
      toast.success(`Campagna "${created.name}" creata.`);
      onSelectCampaign?.({ id: created.id, name: created.name });
    } catch (error) {
      toast.error(describeDataError(error, 'Impossibile creare la campagna.'));
    }
  };

  const handleJoin = async (code: string) => {
    if (!user) return;
    try {
      const joined = await campaignService.joinCampaignByCode(user, code);
      setActiveTab('list');
      toast.success(`Ti sei unito alla campagna "${joined.name}".`);
    } catch (error) {
      toast.error(error instanceof campaignService.CampaignError
        ? error.message
        : describeDataError(error, 'Impossibile unirsi alla campagna.'));
    }
  };

  const handleShareLocal = async (local: ILocalCampaign) => {
    if (!user) return;
    try {
      const created = await campaignService.shareLocalCampaign(user, local);
      refreshLocalCampaigns();
      // I personaggi associati alla campagna locale passano a quella condivisa.
      const linked = characters.filter((c) => c.campaignId === local.id);
      for (const character of linked) {
        const updated = await saveCharacter({ ...character, campaignId: created.id, campaignName: created.name });
        // La campagna non è ancora nell'elenco in tempo reale: pubblichiamo il riepilogo direttamente.
        await campaignService.publishCharacter(created.id, updated, user.uid).catch(() => undefined);
      }
      if (selectedCampaignId === local.id) onSelectCampaign?.({ id: created.id, name: created.name });
      toast.success(`"${created.name}" è ora condivisa. Codice d'invito: ${created.inviteCode}`);
    } catch (error) {
      toast.error(describeDataError(error, 'Impossibile condividere la campagna.'));
    }
  };

  const handleDeleteLocal = async (local: ILocalCampaign) => {
    const ok = await confirmDialog({
      title: `Eliminare "${local.name}"?`,
      message: 'La campagna salvata su questo dispositivo verrà rimossa. I personaggi non vengono eliminati.',
      confirmLabel: 'Elimina',
      destructive: true,
    });
    if (!ok) return;
    campaignService.deleteLocalCampaign(local.id);
    refreshLocalCampaigns();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'list', label: `Le mie campagne (${campaigns.length + localCampaigns.length})` },
    { id: 'create', label: '+ Nuova' },
    ...(user ? [{ id: 'join' as const, label: 'Unisciti con un codice' }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex animate-fadeIn items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Campagne">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl">
        <header className="flex items-center justify-between border-b border-border bg-background/50 px-6 py-4">
          <div className="flex items-center gap-2 text-accent">
            <UserGroupIcon className="h-6 w-6" />
            <h3 className="font-cinzel text-xl font-bold">Campagne</h3>
          </div>
          <button onClick={onClose} aria-label="Chiudi" className="rounded-lg p-1 transition-colors hover:bg-muted">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>

        <div className="no-scrollbar flex gap-4 overflow-x-auto border-b border-border bg-background/20 px-6 pt-3" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 whitespace-nowrap border-b-2 pb-3 text-sm font-semibold transition-all ${
                activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'list' && (
            <CampaignListTab
              uid={uid}
              campaigns={campaigns}
              localCampaigns={localCampaigns}
              loading={loading}
              loadError={loadError}
              selectedCampaignId={selectedCampaignId}
              onSelectCampaign={onSelectCampaign}
              onShareLocal={handleShareLocal}
              onDeleteLocal={handleDeleteLocal}
              onCreate={() => setActiveTab('create')}
              onClose={onClose}
            />
          )}
          {activeTab === 'create' && <CampaignCreateForm isShared={!!user} onCreate={handleCreate} />}
          {activeTab === 'join' && user && <CampaignJoinForm onJoin={handleJoin} />}
        </div>
      </div>
    </div>
  );
};
