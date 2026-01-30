export const LeadStatus = {
    NEW: 'new',
    CONTACTED: 'contacted',
    TRIAL_BOOKED: 'trial_booked',
    CONVERTED: 'converted',
    LOST: 'lost'
} as const;

export type LeadStatus = typeof LeadStatus[keyof typeof LeadStatus];

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { title: string; color: string }> = {
    [LeadStatus.NEW]: { title: 'New Leads', color: 'bg-blue-500' },
    [LeadStatus.CONTACTED]: { title: 'Contacted', color: 'bg-yellow-500' },
    [LeadStatus.TRIAL_BOOKED]: { title: 'Trial Booked', color: 'bg-purple-500' },
    [LeadStatus.CONVERTED]: { title: 'Converted', color: 'bg-green-500' },
    [LeadStatus.LOST]: { title: 'Lost', color: 'bg-gray-500' }
};

export const LEAD_STATUS_ORDER = [
    LeadStatus.NEW,
    LeadStatus.CONTACTED,
    LeadStatus.TRIAL_BOOKED,
    LeadStatus.CONVERTED,
    LeadStatus.LOST
];
