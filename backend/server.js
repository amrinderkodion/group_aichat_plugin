import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve paths to the outside folders
const distPath = path.join(__dirname, '..', 'dist');
const publicPath = path.join(__dirname, '..', 'public');

// Serve static files
app.use('/dist', express.static(distPath));
app.use(express.static(publicPath));

// Shared history state on the server
const INITIAL_GREETING = [
    { role: 'model', parts: [{ text: 'Welcome to the temporary session! History is not saved.' }] }
];

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // 2. Only send the initial greeting to new users, not the full history
    // socket.emit('sync-history', INITIAL_GREETING);

    socket.on('message-sent', (newMessage) => {
        // Broadcast the single message to all OTHER connected users
        socket.broadcast.emit('new-remote-message', newMessage);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = 4173;
httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});