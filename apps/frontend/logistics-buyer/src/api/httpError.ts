/** Shape mirrors Angular's HttpErrorResponse so ported error handling (`e.error?.error?.message`, `e.error?.message`) works unchanged. */
export class HttpError extends Error {
  status: number;
  error: any;
  constructor(status: number, error: any, message?: string) {
    super(message || `Http failure response: ${status}`);
    this.status = status;
    this.error = error;
  }
}
