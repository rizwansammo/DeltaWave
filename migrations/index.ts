import * as migration_20261015_172114_initial from './20261015_172114_initial';
import * as migration_20261016_161108_phase2b_catalog_order from './20261016_161108_phase2b_catalog_order';
import * as migration_20261016_184142_phase2cd_pages_and_settings from './20261016_184142_phase2cd_pages_and_settings';

export const migrations = [
  {
    up: migration_20261015_172114_initial.up,
    down: migration_20261015_172114_initial.down,
    name: '20261015_172114_initial',
  },
  {
    up: migration_20261016_161108_phase2b_catalog_order.up,
    down: migration_20261016_161108_phase2b_catalog_order.down,
    name: '20261016_161108_phase2b_catalog_order',
  },
  {
    up: migration_20261016_184142_phase2cd_pages_and_settings.up,
    down: migration_20261016_184142_phase2cd_pages_and_settings.down,
    name: '20261016_184142_phase2cd_pages_and_settings'
  },
];
