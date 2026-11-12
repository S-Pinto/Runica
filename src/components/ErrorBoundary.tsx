import { useEffect } from 'react';
import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';

const ErrorPage = ({ title, message }: { title: string; message: string }) => (
  <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
    <p className="font-norse text-5xl text-accent">R</p>
    <h1 className="font-cinzel text-2xl font-bold text-foreground">{title}</h1>
    <p className="text-sm text-muted-foreground">{message}</p>
    <Link
      to="/"
      className="mt-2 inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-dark"
    >
      Torna ai tuoi eroi
    </Link>
  </div>
);

const isChunkLoadError = (message: string) =>
  message.includes('dynamically imported module') || message.includes('Importing a module script failed');

export function ErrorBoundary() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : '';

  // After a new deploy, old lazy-loaded chunks disappear: reload once to fetch the new build.
  useEffect(() => {
    if (!isChunkLoadError(message)) return;
    const last = Number(sessionStorage.getItem('runica-last-reload') || 0);
    if (Date.now() - last > 5000) {
      sessionStorage.setItem('runica-last-reload', String(Date.now()));
      window.location.reload();
    }
  }, [message]);

  if (isRouteErrorResponse(error)) {
    return error.status === 404 ? (
      <NotFound />
    ) : (
      <ErrorPage title={`Errore ${error.status}`} message={typeof error.data === 'string' ? error.data : error.statusText} />
    );
  }

  return <ErrorPage title="Qualcosa è andato storto" message={message || 'Errore sconosciuto. Prova a ricaricare la pagina.'} />;
}

export function NotFound() {
  return <ErrorPage title="Pagina non trovata" message="La pagina che cerchi non esiste o è stata spostata." />;
}
