import { ZodError } from 'zod';
export const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
export function notFound(_req, res) { res.status(404).json({ message: 'Endpoint not found.' }); }
export function errorHandler(error, _req, res, _next) { console.error(error); if (error instanceof ZodError) return res.status(400).json({ message: 'Please check the submitted details.', issues: error.flatten() }); if (error.name === 'CastError') return res.status(404).json({ message: 'Record not found.' }); if (error.code === 11000) return res.status(409).json({ message: 'This record already exists.' }); res.status(error.status || 500).json({ message: error.expose ? error.message : 'Something went wrong.' }); }
