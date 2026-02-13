import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*", // Allow all for now, lock down in prod
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('join_room', (room) => {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room ${room}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getSocketIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

// Helper to send notifications to specific users
export const notifyUser = (userId: number | string, event: string, data: any) => {
    if (!io) return;
    // We assume users join a room named "user_<id>"
    io.to(`user_${userId}`).emit(event, data);
};

// Helper to broadcast to all
export const notifyAll = (event: string, data: any) => {
    if (!io) return;
    io.emit(event, data);
};
