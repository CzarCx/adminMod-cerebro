import Tabla from '../../components/Tabla';

export default function ReportesPage() {
  return (
    <main className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Registros Reportados</h1>
        <p className="mt-2 text-lg text-gray-600">Aquí se listan todos los registros que han sido marcados con un reporte para su revisión y seguimiento.</p>
      </header>
      <div className="bg-white shadow-md rounded-xl">
        <Tabla pageType="reportes" />
      </div>
    </main>
  );
}
