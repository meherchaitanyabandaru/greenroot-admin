import { describe, expect, it } from 'vitest';
import { pickedName } from '../../../src/features/plants/botanicalName';

describe('pickedName', () => {
  it('keeps an accepted name as picked', () => {
    expect(
      pickedName({ wfo_id: 'wfo-0000318521', scientific_name: 'Syzygium cumini', taxon_rank: 'species', status: 'ACCEPTED' }),
    ).toEqual({ scientificName: 'Syzygium cumini', wfoId: 'wfo-0000318521' });
  });

  it('saves a synonym as its accepted species, like POST /plants/resolve', () => {
    expect(
      pickedName({
        wfo_id: 'wfo-0000303023',
        scientific_name: 'Sapota achras',
        taxon_rank: 'species',
        status: 'SYNONYM',
        accepted_wfo_id: 'wfo-0000235995',
        accepted_name: 'Manilkara zapota',
      }),
    ).toEqual({ scientificName: 'Manilkara zapota', wfoId: 'wfo-0000235995' });
  });
});
