import { XataApiClient } from '@xata.io/client';
import dotenv from 'dotenv';

dotenv.config();

async function waitForMigrationToFinish(
  api: XataApiClient,
  workspace: string,
  region: string,
  database: string,
  branch: string,
  jobId: string
) {
  const { status, error } = await api.migrations.getMigrationJobStatus({
    pathParams: { workspace, region, dbBranchName: `${database}:${branch}`, jobId }
  });
  if (status === 'failed') {
    throw new Error(`Migration failed, ${error}`);
  }

  if (status === 'completed') {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));
  return await waitForMigrationToFinish(api, workspace, region, database, branch, jobId);
}

export const setupTest = () => {
  const workspace = process.env.XATA_WORKSPACE;
  const region = process.env.XATA_REGION ?? 'us-east-1';
  const apiKey = process.env.XATA_API_KEY;
  const database = `db-${Math.random().toString(36).substring(7)}`;
  const branch = 'main';

  if (!workspace || !apiKey) {
    throw new Error('XATA_WORKSPACE and XATA_API_KEY must be set');
  }

  const api = new XataApiClient({ apiKey });

  const hooks = {
    beforeAll: async () => {
      await api.databases.createDatabase({
        pathParams: { dbName: database, workspaceId: workspace },
        body: { region, branchName: branch },
        headers: { 'X-Features': 'feat-pgroll-migrations=1' }
      });

      const { jobID } = await api.migrations.applyMigration({
        pathParams: { workspace, region, dbBranchName: `${database}:${branch}` },
        body: {
          operations: [
            {
              create_table: {
                name: 'users',
                columns: [
                  { name: 'name', type: 'text', nullable: false },
                  { name: 'age', type: 'integer', nullable: true }
                ]
              }
            }
          ],
          adaptTables: true
        }
      });

      await waitForMigrationToFinish(api, workspace, region, database, 'main', jobID);
    },
    afterAll: async () => {
      await api.databases.deleteDatabase({
        pathParams: { dbName: database, workspaceId: workspace }
      });
    }
  };

  return { hooks, workspace, region, apiKey, database, branch };
};
