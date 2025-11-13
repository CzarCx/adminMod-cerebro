
import Tabla from '../../components/Tabla';

export default function RegistrosHistoricosPage() {
  return (
    <main className="space-y-8">
      <header className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Registros Históricos</h1>
        <p className="mt-2 text-muted-foreground">Aquí se listan todos los registros históricos de paquetes.</p>
      </header>
      <div className="bg-card p-4 rounded-lg border">
        <Tabla pageType="seguimiento" />
      </div>
    </main>
  );
}
