import Tabla from '../../components/Tabla';

export default function ReportesPage() {
  return (
    <main className="space-y-8">
      <header className="border-b pb-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Registros Reportados</h1>
        <p className="mt-2 text-muted-foreground">Aquí se listan todos los registros que han sido marcados con un reporte para su revisión y seguimiento.</p>
      </header>
      <div className="bg-card p-4 rounded-lg border">
        <Tabla pageType="reportes" />
      </div>
    </main>
  );
}
