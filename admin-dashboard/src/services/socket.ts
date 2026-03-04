import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
    if (!socket) {
        socket = io('http://localhost:3001', {
            autoConnect: true,
            reconnection: true
        });

        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });
    }
    return socket;
};

export const joinComplexRoom = (complexId: number) => {
    const s = getSocket();
    s.emit('join_room', `complex_${complexId}`);
};
