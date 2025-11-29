
'use client';

import Tabla from '../../components/Tabla';

export default function TiempoRestantePage() {
  return (
    <main className="space-y-8">
      <header className="border-b pb-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Tiempo Restante de Hoy</h1>
        <p className="mt-2 text-muted-foreground">Aquí se muestra la cuenta regresiva para los registros del día de hoy.</p>
      </header>
      <div className="bg-card p-4 rounded-lg border">
        <Tabla pageType="seguimiento" filterByToday={true} />
      </div>
    </main>
  );
}
