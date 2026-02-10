export const FEATURE_PERMISSION_MAP: Record<string, string[]> = {
  // Feature Key: [Permission Patterns / Keys]

  // Core
  'core.multi_studio': ['studio.*'],
  'core.rooms': ['room.*'],
  'core.devices': ['device.*'],
  'core.sessions': ['session.*'],

  // Coach
  'core.coaches': [
    'coach.read',
    'coach.create',
    'coach.update',
    'coach.delete',
    'coach.list',
  ],
  // 'coach.portal' controls login access, verified in AuthService.generateTokens
  // 'coach.analytics' controls specific permissions
  'coach.analytics': ['coach.performance.view'],

  // Finance
  'finance.pos': ['finance.pos.*'],
  'finance.retail': ['finance.product.*', 'finance.inventory.*'],
  'finance.invoicing': ['finance.invoice.*'],
  'finance.reports': ['finance.report.*'],

  // Marketing
  'marketing.automation': ['marketing.automation.*', 'marketing.campaign.*'],
  'marketing.leads_crm': ['marketing.lead.*'],

  // Communication
  'communication.announcements': ['communication.announcement.*'],
  'communication.sms': ['communication.sms.*'],
  'communication.email': ['communication.email.*'],

  // Compliance
  'compliance.data_export': ['compliance.export.*'],
  'compliance.audit_logs': ['compliance.audit.*'],
};

/**
 * Checks if a permission key should be allowed based on enabled features.
 * If the permission matches a restricted pattern, the corresponding feature MUST be enabled.
 */
export function isPermissionAllowed(
  permissionKey: string,
  enabledFeatures: string[],
): boolean {
  for (const [featureKey, restrictedPatterns] of Object.entries(
    FEATURE_PERMISSION_MAP,
  )) {
    // Check if permission matches any restricted pattern for this feature
    const isRestricted = restrictedPatterns.some((pattern) => {
      if (pattern.endsWith('.*')) {
        const prefix = pattern.slice(0, -2);
        return permissionKey.startsWith(prefix);
      }
      return permissionKey === pattern;
    });

    if (isRestricted) {
      // If it is restricted by this feature, the feature MUST be enabled
      if (!enabledFeatures.includes(featureKey)) {
        return false;
      }
    }
  }
  // If permission doesn't match any restricted pattern, it's allowed by default (core permission)
  return true;
}
