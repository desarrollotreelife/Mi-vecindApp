export const getImageUrl = (path: string | null | undefined) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('data:image')) return path;

    // Clean path to avoid double slashes
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // Use environment variable or default to localhost:3001
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    // Remove /api if present in the base URL since images are usually served from root or specific static route
    // But in our server.ts 'app.use('/backup', ...)' serves files at /backup
    // The DB stores paths like '/backup/RESIDENTES/...' or just relative ones.

    // If path starts with /backup, just append to host (not API)
    // Server is http://localhost:3001
    // Static serve at /backup

    // If the path from DB is like "/backup/RESIDENTES/foo.png"
    return `${API_URL}${cleanPath}`;
};
