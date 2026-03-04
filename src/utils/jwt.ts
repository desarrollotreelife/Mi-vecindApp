import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export const signToken = (payload: object, expiresIn = '24h') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn } as jwt.SignOptions);
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};
