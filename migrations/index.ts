import * as migration_20261015_172114_initial from './20261015_172114_initial';

export const migrations = [
  {
    up: migration_20261015_172114_initial.up,
    down: migration_20261015_172114_initial.down,
    name: '20261015_172114_initial'
  },
];
