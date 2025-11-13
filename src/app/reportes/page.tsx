import Tabla from '../../components/Tabla';

export default function ReportesPage() {
  return (
    <main>
      <header>
        <h1>Registros Reportados</h1>
        <p>Aquí se listan todos los registros que han sido marcados con un reporte para su revisión y seguimiento.</p>
      </header>
      <div>
        <Tabla pageType="reportes" />
      </div>
    </main>
  );
}
