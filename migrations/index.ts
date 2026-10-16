import * as migration_20261015_172114_initial from './20261015_172114_initial';
import * as migration_20261016_161108_phase2b_catalog_order from './20261016_161108_phase2b_catalog_order';

export const migrations = [
  {
    up: migration_20261015_172114_initial.up,
    down: migration_20261015_172114_initial.down,
    name: '20261015_172114_initial',
  },
  {
    up: migration_20261016_161108_phase2b_catalog_order.up,
    down: migration_20261016_161108_phase2b_catalog_order.down,
    name: '20261016_161108_phase2b_catalog_order'
  },
];
