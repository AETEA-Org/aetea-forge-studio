import { formatDistanceFromUTC } from "@/lib/dateUtils";

interface CampaignHeaderProps {
  title: string;
  lastModified?: string;
}

export function CampaignHeader({ title, lastModified }: CampaignHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      {lastModified && (
        <p className="text-sm text-muted-foreground mt-1">
          Updated {formatDistanceFromUTC(lastModified, { addSuffix: true })}
        </p>
      )}
    </div>
  );
}
