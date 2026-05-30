import { ImageSource, ContentSource, OgFetchStatus } from '../../types/models';

interface SourceBadgeProps {
  imageSource?: ImageSource;
  descriptionSource?: ContentSource;
  ogFetchStatus?: OgFetchStatus;
  compact?: boolean;
}

/**
 * SourceBadge Component
 *
 * Admin-only badge showing how product content was sourced (OG fetch vs manual upload).
 * Only visible to logged-in admins in the dashboard and product editor.
 *
 * Displays:
 * - Success: Green badge for fully fetched content
 * - Partial Success: Yellow badge with breakdown (Image + Desc)
 * - Failed: Red badge for failed fetches
 * - Manual: Gray badge (or no badge) for manually uploaded products
 */
export function SourceBadge({
  imageSource,
  descriptionSource,
  ogFetchStatus,
  compact = false
}: SourceBadgeProps) {
  // Don't show if all manual or no status
  if (!ogFetchStatus || ogFetchStatus === 'NOT_ATTEMPTED') {
    return null;
  }

  const getBadgeColor = () => {
    switch (ogFetchStatus) {
      case 'SUCCESS':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'PARTIAL_SUCCESS':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
      case 'FAILED':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = () => {
    switch (ogFetchStatus) {
      case 'SUCCESS':
        return 'OG Fetch';
      case 'PARTIAL_SUCCESS':
        return 'Partial Fetch';
      case 'FAILED':
        return 'Fetch Failed';
      default:
        return 'Manual';
    }
  };

  const getDetailText = () => {
    const parts: string[] = [];
    if (imageSource === 'OG_FETCH') parts.push('Image');
    if (descriptionSource === 'OG_FETCH') parts.push('Desc');
    return parts.length > 0 ? parts.join(' + ') : 'Manual';
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border ${getBadgeColor()}`}>
      {getStatusText()}
      {!compact && ogFetchStatus === 'PARTIAL_SUCCESS' && (
        <span className="text-[10px] opacity-75">({getDetailText()})</span>
      )}
    </span>
  );
}
