import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserGroupIcon } from '../../../components/ui/icons';
import { confirmDialog, toast } from '../../../components/ui/Dialogs';
import { Modal } from '../../../components/ui/Modal';
import { TabButton } from '../../../components/ui/TabButton';
import { useAuth } from '../../../providers/AuthProvider';
import { useCampaigns } from '../../../providers/CampaignProvider';
import * as campaignService from '../../../services/campaignService';
import { describeDataError } from '../../../lib/errors';
import { useCharacter } from '../CharacterProvider';
import type { ILocalCampaign } from '../characterTypes';
import { formatInviteCode } from '../rules/campaign';
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
  const navigate = useNavigate();

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
      onClose();
      // Subito la scelta del personaggio con cui sedersi al tavolo.
      navigate(`/campaigns/${joined.id}`, { state: { pickCharacter: true } });
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
      toast.success(`"${created.name}" è ora condivisa. Codice d'invito: ${formatInviteCode(created.inviteCode)}`);
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
    { id: 'list', label: `Le mie (${campaigns.length + localCampaigns.length})` },
    { id: 'create', label: 'Nuova' },
    ...(user ? [{ id: 'join' as const, label: 'Unisciti con un codice' }] : []),
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title="Campagne"
      icon={<UserGroupIcon />}
      size="lg"
      toolbar={
        <div className="no-scrollbar flex overflow-x-auto px-1" role="tablist" aria-label="Sezioni delle campagne">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              id={`campaign-tab-${tab.id}`}
              controls="campaign-tabpanel"
              label={tab.label}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>
      }
    >
      <div id="campaign-tabpanel" role="tabpanel" aria-labelledby={`campaign-tab-${activeTab}`}>
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
    </Modal>
  );
};
