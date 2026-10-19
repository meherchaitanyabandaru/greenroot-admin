import { useListMarketReportsQuery } from '../../api/adminResources';

/**
 * A live count for a sidebar item, or undefined. Today only the Local Market
 * Review Queue has one: open reports. RTK Query shares the one request across
 * every caller and refreshes it each minute.
 */
export function useNavBadge(path: string): string | undefined {
  const { data } = useListMarketReportsQuery({ status: 'PENDING', page: 1, per_page: 1 }, { pollingInterval: 60_000 });
  const open = data?.pagination?.total ?? 0;
  return path === '/market/review' && open > 0 ? String(open) : undefined;
}
