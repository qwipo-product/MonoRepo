// Entry point of the mock backend: auto-registers every route module in ./routes.
import.meta.glob('./routes/*.ts', { eager: true });
export { handleMockRequest, listRoutes } from './server';
