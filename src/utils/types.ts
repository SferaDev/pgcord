import { Kysely } from 'kysely';
import { z } from 'zod';

export type OperationContext = {
  db: Kysely<Record<string, any>>;
};

export const KyselySchema = z.instanceof(Kysely<Record<string, any>>);
