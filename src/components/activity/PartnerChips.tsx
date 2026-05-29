import type { Activity, Partner } from '../../types';

interface PartnerChipListProps {
  partnerIds: string[];
  partners: Partner[];
  className?: string;
}

export function PartnerChipList({
  partnerIds,
  partners,
  className = '',
}: PartnerChipListProps) {
  if (partnerIds.length === 0) return null;

  return (
    <span className={`partner-chips ${className}`.trim()}>
      {partnerIds.map((id) => {
        const partner = partners.find((p) => p.id === id);
        const label = partner ? partner.nickname || partner.name : 'Unknown';
        return (
          <span key={id} className="partner-chip">
            {label}
          </span>
        );
      })}
    </span>
  );
}

export function activityInvolvesPartner(
  activity: Activity,
  partnerId: string
): boolean {
  return activity.partnerIds.includes(partnerId);
}

export function getPartnerLinkLabel(activity: Activity, partners: Partner[]): string {
  if (activity.partnerIds.length > 0) {
    return activity.partnerIds
      .map((id) => partners.find((p) => p.id === id))
      .filter(Boolean)
      .map((p) => p!.nickname || p!.name)
      .join(', ');
  }
  if (activity.peopleCount != null && activity.peopleCount > 0) {
    return `${activity.peopleCount} people`;
  }
  return '';
}
