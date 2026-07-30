import React, { useState, useEffect } from 'react';
import { ICampaign } from '../characterTypes';
import * as campaignService from '../../../services/campaignService';
import { XMarkIcon, PlusIcon, UserGroupIcon, CopyIcon, CheckIcon } from '../../../components/ui/icons';

interface CampaignManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCampaign?: (campaign: ICampaign | null) => void;
  selectedCampaignId?: string;
}

export const CampaignManagerModal: React.FC<CampaignManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectCampaign,
  selectedCampaignId,
}) => {
  const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'join'>('list');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCampaigns(campaignService.getCampaigns());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;
    const created = campaignService.createCampaign(newCampaignName, newCampaignDesc);
    setCampaigns(campaignService.getCampaigns());
    setNewCampaignName('');
    setNewCampaignDesc('');
    setActiveTab('list');
    if (onSelectCampaign) onSelectCampaign(created);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-card border border-border text-foreground w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <header className="flex justify-between items-center px-6 py-4 border-b border-border bg-background/50">
          <div className="flex items-center gap-2 text-accent">
            <UserGroupIcon className="w-6 h-6" />
            <h3 className="text-xl font-cinzel font-bold">Gestione Campagne</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        {/* Tab Selection */}
        <div className="flex border-b border-border bg-background/20 px-6 pt-3 gap-4">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-3 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'list'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Le Mie Campagne ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'create'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            + Nuova Campagna
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`pb-3 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'join'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Unisciti tramite Codice
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'list' && (
            <div className="space-y-3">
              {campaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground space-y-2">
                  <p>Nessuna campagna creata al momento.</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 bg-accent/20 border border-accent/40 text-accent font-semibold rounded-lg hover:bg-accent/30 transition-all text-sm"
                  >
                    Crea la prima campagna
                  </button>
                </div>
              ) : (
                campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col gap-2 ${
                      selectedCampaignId === camp.id
                        ? 'border-accent bg-accent/10 shadow-[0_0_12px_rgba(var(--color-accent),0.2)]'
                        : 'border-border bg-background/30 hover:border-accent/40'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-cinzel text-lg font-bold text-accent">{camp.name}</h4>
                        {camp.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{camp.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyCode(camp.code)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-muted/60 hover:bg-accent/20 text-accent border border-accent/30 transition-all"
                          title="Copia codice di invito"
                        >
                          {copiedCode === camp.code ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
                          <span className="font-mono">{camp.code}</span>
                        </button>
                      </div>
                    </div>
                    {onSelectCampaign && (
                      <button
                        onClick={() => {
                          onSelectCampaign(selectedCampaignId === camp.id ? null : camp);
                          onClose();
                        }}
                        className={`w-full mt-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedCampaignId === camp.id
                            ? 'bg-accent text-accent-foreground shadow-sm'
                            : 'bg-secondary/60 text-secondary-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        {selectedCampaignId === camp.id ? 'Selezionata (Clicca per rimuovere)' : 'Associa Scheda'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Nome Campagna
                </label>
                <input
                  type="text"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="Es. La Maledizione di Strahd"
                  required
                  className="w-full bg-input/60 border border-border rounded-xl p-3 text-foreground focus:ring-2 focus:ring-accent/40 focus:border-accent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Descrizione / Note DM (Opzionale)
                </label>
                <textarea
                  value={newCampaignDesc}
                  onChange={(e) => setNewCampaignDesc(e.target.value)}
                  placeholder="Breve intro o dettagli della campagna..."
                  rows={3}
                  className="w-full bg-input/60 border border-border rounded-xl p-3 text-foreground focus:ring-2 focus:ring-accent/40 focus:border-accent outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-accent text-accent-foreground font-bold rounded-xl shadow-lg hover:bg-accent-light transition-all flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-5 h-5" /> Crea Campagna
              </button>
            </form>
          )}

          {activeTab === 'join' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!joinCode.trim()) return;
                const joined = campaignService.joinCampaignByCode(joinCode, 'temp_char');
                if (joined) {
                  setCampaigns(campaignService.getCampaigns());
                  setJoinCode('');
                  setActiveTab('list');
                  alert(`Ti sei unito alla campagna "${joined.name}"!`);
                } else {
                  alert('Codice campagna non valido.');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Codice Invito Campagna (6 caratteri)
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Es. X7K9AB"
                  maxLength={6}
                  required
                  className="w-full bg-input/60 border border-border rounded-xl p-3 font-mono text-center tracking-widest text-lg font-bold text-accent uppercase focus:ring-2 focus:ring-accent/40 focus:border-accent outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-accent text-accent-foreground font-bold rounded-xl shadow-lg hover:bg-accent-light transition-all flex items-center justify-center gap-2"
              >
                Unisciti alla Campagna
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
