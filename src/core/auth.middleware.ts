import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = decoded;
    next();
};

export const authorize = (allowedRoles: string[]) => {
    return (req: any, res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // We assume the token payload has { role: 'admin' | 'super_admin' | ... }
        // If not, we should fetch it from DB, but for JWT efficiency we usually embed it.
        // Let's assume the login process tokenizes the role name.

        // Normalize checking
        const userRole = user.role?.name || user.role; // Handle object or string

        if (allowedRoles.includes(userRole)) {
            next();
        } else {
            console.warn(`Access denied for role ${userRole}. Required: ${allowedRoles.join(', ')}`);
            res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
        }
    };
};
