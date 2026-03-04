import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 3001;

import http from 'http';
import { initSocket } from './core/socket.service';
import { initCronJobs } from './core/cron.service';

const server = http.createServer(app);
initSocket(server);
initCronJobs();

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// trigger nodemon restart
