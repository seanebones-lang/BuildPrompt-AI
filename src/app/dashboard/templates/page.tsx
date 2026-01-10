import { DataTable } from '@/components/ui/data-table';
import { columns } from '@/components/templates-table';
import { getUserTemplates } from '@/lib/queries';

export default async function TemplatesPage() {
  const templates = await getUserTemplates({ publicOnly: false });

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Prompt Templates Library</h1>
      <DataTable columns={columns} data={templates} />
    </div>
  );
}