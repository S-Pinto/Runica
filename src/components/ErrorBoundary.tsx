import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-500">{error.status} {error.statusText}</h1>
        <p className="text-zinc-400">{error.data}</p>
      </div>
    );
  }

  // Gestione dell'errore di caricamento dei chunk (comune dopo un nuovo deploy)
  React.useEffect(() => {
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('dynamically imported module') ||
      errorMessage.includes('Importing a module script failed') ||
      errorMessage.includes('Failed to fetch dynamically imported module')) {

      const lastReload = sessionStorage.getItem('runica-last-reload');
      const now = Date.now();

      // Ricarica solo se l'ultimo ricaricamento è stato più di 5 secondi fa (evita loop infiniti)
      if (!lastReload || (now - parseInt(lastReload)) > 5000) {
        sessionStorage.setItem('runica-last-reload', now.toString());
        window.location.reload();
      }
    }
  }, [error]);

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold text-red-500">Something went wrong</h1>
      <p className="text-zinc-400">{errorMessage}</p>
    </div>
  );
}

export function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold text-red-500">Error</h1>
      <p className="text-zinc-400">{error.message}</p>
    </div>
  );
}
export function NotFound() {
  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold text-red-500">404 Not Found</h1>
      <p className="text-zinc-400">The page you are looking for does not exist.</p>
    </div>
  );
}
export function Unauthorized() {
  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold text-red-500">Unauthorized</h1>
      <p className="text-zinc-400">You do not have permission to access this page.</p>
    </div>
  );
}
export function Forbidden() {
  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold text-red-500">403 Forbidden</h1>
      <p className="text-zinc-400">You do not have permission to access this resource.</p>
    </div>
  );
}

export function InternalServerError() {
  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold text-red-500">500 Internal Server Error</h1>
      <p className="text-zinc-400">An unexpected error occurred on the server.</p>
    </div>
  );
}

export function BadRequest() {
  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold text-red-500">400 Bad Request</h1>
      <p className="text-zinc-400">The request could not be understood by the server due to malformed syntax.</p>
    </div>
  );
}

export function ServiceUnavailable() {
  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold text-red-500">503 Service Unavailable</h1>
      <p className="text-zinc-400">The server is currently unable to handle the request due to temporary overloading or maintenance.</p>
    </div>
  );
}

export function GatewayTimeout() {
  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold text-red-500">504 Gateway Timeout</h1>
      <p className="text-zinc-400">The server did not receive a timely response from an upstream server.</p>
    </div>
  );
}

export function Conflict() {
  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold text-red-500">409 Conflict</h1>
      <p className="text-zinc-400">The request could not be completed due to a conflict with the current state of the resource.</p>
    </div>
  );
}