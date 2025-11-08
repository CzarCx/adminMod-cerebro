import Tabla from '../../components/Tabla';

export default function ReportesPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 lg:p-24 bg-gray-50">
      <div className="w-full max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-green-800">Registros Reportados</h1>
          <p className="mt-2 text-lg text-gray-600">Aquí se listan todos los registros que han sido marcados con un reporte para su revisión.</p>
        </header>
        <div className="bg-white shadow-lg rounded-xl p-4">
          <Tabla pageType="reportes" />
        </div>
      </div>
    </main>
  );
}
