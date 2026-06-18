import express, { type Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';
import { auditLog } from './audit-log';

type HttpError = {
  status?: number;
  statusCode?: number;
  message?: string;
  name?: string;
};

type RequestWithUser = Request & {
  user?: {
    id?: string;
  };
};

function normalizeHttpError(error: unknown): HttpError {
  return typeof error === 'object' && error !== null ? (error as HttpError) : {};
}

function getHttpStatus(httpError: HttpError): number {
  return httpError.status ?? httpError.statusCode ?? 500;
}

function getHttpResponseMessage(httpError: HttpError, status: number): string {
  return status >= 500 ? 'Internal Server Error' : (httpError.message ?? 'Request failed');
}

function logHttpError(req: Request, httpError: HttpError, status: number): void {
  auditLog
    .log('critical', 'system', 'HTTP request failed', {
      userId: (req as RequestWithUser).user?.id,
      resource: 'http',
      details: {
        status,
        path: req.path,
        method: req.method,
        errorName: httpError.name,
      },
    })
    .catch((logError: unknown) => {
      console.error('Audit log write failed:', logError);
    });
}

function handleHttpError(err: unknown, req: Request, res: Response): void {
  const httpError = normalizeHttpError(err);
  const status = getHttpStatus(httpError);
  logHttpError(req, httpError, status);
  res.status(status).json({ message: getHttpResponseMessage(httpError, status) });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: unknown;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + '…';
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    void next;
    handleHttpError(err, req, res);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get('env') === 'development') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(
    {
      port,
      host: '0.0.0.0',
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
