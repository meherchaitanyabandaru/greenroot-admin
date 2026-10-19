import type { BotanicalName } from '../../api/adminResources';

/** A synonym is stored as its accepted species, as POST /plants/resolve does. */
export function pickedName(name: BotanicalName) {
  return {
    scientificName: name.accepted_name ?? name.scientific_name,
    wfoId: name.accepted_wfo_id ?? name.wfo_id,
  };
}

/** Indian digit grouping: 1657866 → 16,57,866. */
export const formatCount = (n: number) => n.toLocaleString('en-IN');
