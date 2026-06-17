import type { Activity, Partner } from '../types';
import { compareActivitiesByDateTime, getPartnerLastIntimacy } from './utils';

export type ActivitySortOption =
  | 'newest'
  | 'oldest'
  | 'partner_az'
  | 'partner_za'
  | 'satisfaction_high'
  | 'satisfaction_low'
  | 'protection_yes'
  | 'protection_no';

export type PartnerSortOption =
  | 'name_az'
  | 'name_za'
  | 'last_intimacy_newest'
  | 'last_intimacy_oldest'
  | 'relationship_type'
  | 'most_activity'
  | 'least_activity';

export const ACTIVITY_SORT_LABELS: Record<ActivitySortOption, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  partner_az: 'Partner A–Z',
  partner_za: 'Partner Z–A',
  satisfaction_high: 'Satisfaction high → low',
  satisfaction_low: 'Satisfaction low → high',
  protection_yes: 'Protection: Yes first',
  protection_no: 'Protection: No first',
};

export const PARTNER_SORT_LABELS: Record<PartnerSortOption, string> = {
  name_az: 'Name A–Z',
  name_za: 'Name Z–A',
  last_intimacy_newest: 'Last intimacy newest',
  last_intimacy_oldest: 'Last intimacy oldest',
  relationship_type: 'Relationship type',
  most_activity: 'Most activity',
  least_activity: 'Least activity',
};

function getPartnerDisplayName(partner: Partner): string {
  return partner.nickname || partner.name;
}

function getActivityPartnerSortName(activity: Activity, partners: Partner[]): string {
  if (activity.partnerIds.length === 0) return '';
  const names = activity.partnerIds
    .map((id) => partners.find((p) => p.id === id))
    .filter((p): p is Partner => !!p)
    .map((p) => getPartnerDisplayName(p).toLowerCase())
    .sort();
  return names[0] ?? '';
}

function protectionRank(
  protection: Activity['protection'],
  prefer: 'yes' | 'no'
): number {
  if (prefer === 'yes') {
    if (protection === 'yes') return 0;
    if (protection === 'no') return 1;
    return 2;
  }
  if (protection === 'no') return 0;
  if (protection === 'yes') return 1;
  return 2;
}

export function sortActivities(
  activities: Activity[],
  sort: ActivitySortOption,
  partners: Partner[]
): Activity[] {
  const list = [...activities];

  switch (sort) {
    case 'newest':
      return list.sort(compareActivitiesByDateTime);
    case 'oldest':
      return list.sort((a, b) => -compareActivitiesByDateTime(a, b));
    case 'partner_az':
      return list.sort((a, b) => {
        const nameA = getActivityPartnerSortName(a, partners);
        const nameB = getActivityPartnerSortName(b, partners);
        if (!nameA && nameB) return 1;
        if (nameA && !nameB) return -1;
        const cmp = nameA.localeCompare(nameB);
        return cmp !== 0 ? cmp : compareActivitiesByDateTime(a, b);
      });
    case 'partner_za':
      return list.sort((a, b) => {
        const nameA = getActivityPartnerSortName(a, partners);
        const nameB = getActivityPartnerSortName(b, partners);
        if (!nameA && nameB) return 1;
        if (nameA && !nameB) return -1;
        const cmp = nameB.localeCompare(nameA);
        return cmp !== 0 ? cmp : compareActivitiesByDateTime(a, b);
      });
    case 'satisfaction_high':
      return list.sort((a, b) => {
        const sat = b.satisfaction - a.satisfaction;
        return sat !== 0 ? sat : compareActivitiesByDateTime(a, b);
      });
    case 'satisfaction_low':
      return list.sort((a, b) => {
        const sat = a.satisfaction - b.satisfaction;
        return sat !== 0 ? sat : compareActivitiesByDateTime(a, b);
      });
    case 'protection_yes':
      return list.sort((a, b) => {
        const rank = protectionRank(a.protection, 'yes') - protectionRank(b.protection, 'yes');
        return rank !== 0 ? rank : compareActivitiesByDateTime(a, b);
      });
    case 'protection_no':
      return list.sort((a, b) => {
        const rank = protectionRank(a.protection, 'no') - protectionRank(b.protection, 'no');
        return rank !== 0 ? rank : compareActivitiesByDateTime(a, b);
      });
    default:
      return list.sort(compareActivitiesByDateTime);
  }
}

export function getPartnerActivityCount(
  partnerId: string,
  activities: Activity[]
): number {
  return activities.filter((a) => a.partnerIds.includes(partnerId)).length;
}

export function sortPartners(
  partners: Partner[],
  sort: PartnerSortOption,
  activities: Activity[]
): Partner[] {
  const list = [...partners];

  switch (sort) {
    case 'name_az':
      return list.sort((a, b) =>
        getPartnerDisplayName(a).localeCompare(getPartnerDisplayName(b))
      );
    case 'name_za':
      return list.sort((a, b) =>
        getPartnerDisplayName(b).localeCompare(getPartnerDisplayName(a))
      );
    case 'last_intimacy_newest':
      return list.sort((a, b) => {
        const lastA = getPartnerLastIntimacy(a.id, activities);
        const lastB = getPartnerLastIntimacy(b.id, activities);
        if (!lastA && !lastB) {
          return getPartnerDisplayName(a).localeCompare(getPartnerDisplayName(b));
        }
        if (!lastA) return 1;
        if (!lastB) return -1;
        const cmp = lastB.localeCompare(lastA);
        return cmp !== 0 ? cmp : getPartnerDisplayName(a).localeCompare(getPartnerDisplayName(b));
      });
    case 'last_intimacy_oldest':
      return list.sort((a, b) => {
        const lastA = getPartnerLastIntimacy(a.id, activities);
        const lastB = getPartnerLastIntimacy(b.id, activities);
        if (!lastA && !lastB) {
          return getPartnerDisplayName(a).localeCompare(getPartnerDisplayName(b));
        }
        if (!lastA) return 1;
        if (!lastB) return -1;
        const cmp = lastA.localeCompare(lastB);
        return cmp !== 0 ? cmp : getPartnerDisplayName(a).localeCompare(getPartnerDisplayName(b));
      });
    case 'relationship_type':
      return list.sort((a, b) => {
        const cmp = a.relationshipType.localeCompare(b.relationshipType);
        return cmp !== 0 ? cmp : getPartnerDisplayName(a).localeCompare(getPartnerDisplayName(b));
      });
    case 'most_activity':
      return list.sort((a, b) => {
        const countA = getPartnerActivityCount(a.id, activities);
        const countB = getPartnerActivityCount(b.id, activities);
        const cmp = countB - countA;
        return cmp !== 0 ? cmp : getPartnerDisplayName(a).localeCompare(getPartnerDisplayName(b));
      });
    case 'least_activity':
      return list.sort((a, b) => {
        const countA = getPartnerActivityCount(a.id, activities);
        const countB = getPartnerActivityCount(b.id, activities);
        const cmp = countA - countB;
        return cmp !== 0 ? cmp : getPartnerDisplayName(a).localeCompare(getPartnerDisplayName(b));
      });
    default:
      return list;
  }
}
