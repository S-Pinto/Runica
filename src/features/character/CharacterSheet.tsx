import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCharacterEditor } from './hooks/useCharacterEditor';
import { SparklesIcon, BackIcon, UserGroupIcon, HeartIcon, StarIcon, SwordIcon, ShieldIcon, UserCircleIcon } from '../../components/ui/icons';
import { Button } from '../../components/ui/Button';
import { TabButton } from '../../components/ui/TabButton';
import { EquipmentList } from './components/EquipmentList';
import { AttackList } from './components/AttackList';
import { CategorizedFeatureList } from './components/CategorizedFeatureList';
import { CompanionTab } from './components/play-view/CompanionTab';
import { EditorHeader } from './components/editor/EditorHeader';
import { TabPanel } from './components/editor/TabPanel';
import { IdentitySection } from './components/editor/IdentitySection';
import { VitalsSection } from './components/editor/VitalsSection';
import { CombatStatsSection } from './components/editor/CombatStatsSection';
import { AbilitiesPanel } from './components/editor/AbilitiesPanel';
import { BioPanel } from './components/editor/BioPanel';
import { SpellResourcesPanel } from './components/editor/SpellResourcesPanel';

type Tab = 'main' | 'stats' | 'combat' | 'bio' | 'spells' | 'inventory' | 'companions';

const TABS: { key: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'main', label: 'Generale', icon: HeartIcon },
    { key: 'stats', label: 'Caratteristiche', icon: StarIcon },
    { key: 'combat', label: 'Combattimento', icon: SwordIcon },
    { key: 'spells', label: 'Incantesimi', icon: SparklesIcon },
    { key: 'inventory', label: 'Inventario', icon: ShieldIcon },
    { key: 'bio', label: 'Biografia', icon: UserCircleIcon },
    { key: 'companions', label: 'Compagni', icon: UserGroupIcon },
];

export const CharacterSheet: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const tabParam = searchParams.get('tab') as Tab | null;
    const initialTab: Tab = tabParam && TABS.some(t => t.key === tabParam) ? tabParam : 'main';
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    const {
        character, error, isSaving, isDirty, isNewCharacter,
        proficiencyBonus, initiative,
        handleSave, handleDelete, handleBack,
    } = useCharacterEditor(activeTab);

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        setSearchParams({ tab }, { replace: true });
    };

    if (error) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
                <p className="font-cinzel text-2xl font-bold text-foreground">{error}</p>
                <Button variant="secondary" onClick={() => navigate('/')}>
                    <BackIcon className="h-4 w-4" /> Torna ai tuoi eroi
                </Button>
            </div>
        );
    }

    if (!character) {
        return (
            <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6" aria-busy="true" aria-label="Caricamento scheda">
                <div className="h-16 animate-pulse rounded-2xl bg-muted/30" />
                <div className="h-12 animate-pulse rounded-xl bg-muted/20" />
                <div className="h-96 animate-pulse rounded-2xl bg-muted/20" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-4 pb-24 sm:p-6">
            <EditorHeader
                character={character}
                isNewCharacter={isNewCharacter}
                isDirty={isDirty}
                isSaving={isSaving}
                onBack={handleBack}
                onSave={handleSave}
                onDelete={handleDelete}
            />

            <div>
                <nav className="mb-6 border-b border-border">
                    <div role="tablist" aria-label="Sezioni della scheda" className="no-scrollbar flex overflow-x-auto">
                        {TABS.map(tab => (
                            <TabButton
                                key={tab.key}
                                id={`tab-${tab.key}`}
                                label={tab.label}
                                icon={tab.icon}
                                isActive={activeTab === tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                controls={`panel-${tab.key}`} />
                        ))}
                    </div>
                </nav>

                <TabPanel tabKey="main" activeTab={activeTab} className="space-y-6">
                    <IdentitySection character={character} isNewCharacter={isNewCharacter} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <VitalsSection character={character} />
                        </div>
                        <div className="space-y-6">
                            <CombatStatsSection character={character} initiative={initiative} proficiencyBonus={proficiencyBonus} />
                        </div>
                    </div>
                </TabPanel>

                <TabPanel tabKey="stats" activeTab={activeTab}>
                    <AbilitiesPanel character={character} proficiencyBonus={proficiencyBonus} />
                </TabPanel>

                <TabPanel tabKey="combat" activeTab={activeTab} className="min-h-[60vh]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        <div className="space-y-6">
                            <AttackList />
                        </div>
                        <div className="space-y-6">
                            <CategorizedFeatureList />
                        </div>
                    </div>
                </TabPanel>

                <TabPanel tabKey="bio" activeTab={activeTab} className="min-h-[60vh]">
                    <BioPanel character={character} />
                </TabPanel>

                <TabPanel tabKey="inventory" activeTab={activeTab} className="min-h-[60vh]">
                    <EquipmentList />
                </TabPanel>

                <TabPanel tabKey="spells" activeTab={activeTab} className="min-h-[60vh] space-y-6">
                    <SpellResourcesPanel character={character} />
                </TabPanel>

                <TabPanel tabKey="companions" activeTab={activeTab} className="min-h-[60vh]">
                    <CompanionTab />
                </TabPanel>
            </div>
        </div>
    );
};
