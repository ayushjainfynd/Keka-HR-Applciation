import { EntitySchema } from 'typeorm';

export const ApiHitLog = new EntitySchema({
  name: 'ApiHitLog',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: 'increment',
    },
    time: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
});
