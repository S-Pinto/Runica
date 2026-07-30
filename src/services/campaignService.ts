import { ICampaign } from '../features/character/characterTypes';

const CAMPAIGNS_STORAGE_KEY = 'runica_campaigns_v1';

export const getCampaigns = (): ICampaign[] => {
  try {
    const raw = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to parse campaigns from localStorage:', error);
    return [];
  }
};

export const saveCampaigns = (campaigns: ICampaign[]): void => {
  try {
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  } catch (error) {
    console.error('Failed to save campaigns to localStorage:', error);
  }
};

export const createCampaign = (name: string, description: string = '', createdBy: string = 'User'): ICampaign => {
  const campaigns = getCampaigns();
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newCampaign: ICampaign = {
    id: `camp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    description,
    code,
    createdBy,
    createdAt: Date.now(),
    characterIds: [],
  };
  campaigns.push(newCampaign);
  saveCampaigns(campaigns);
  return newCampaign;
};

export const joinCampaignByCode = (code: string, characterId: string): ICampaign | null => {
  const campaigns = getCampaigns();
  const targetCode = code.trim().toUpperCase();
  const campaign = campaigns.find(c => c.code === targetCode);
  if (!campaign) return null;

  if (!campaign.characterIds.includes(characterId)) {
    campaign.characterIds.push(characterId);
    saveCampaigns(campaigns);
  }
  return campaign;
};

export const deleteCampaign = (campaignId: string): void => {
  const campaigns = getCampaigns().filter(c => c.id !== campaignId);
  saveCampaigns(campaigns);
};
