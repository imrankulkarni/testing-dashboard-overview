require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const state = { lastUpdate: null, data: {} };

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.FRONTEND_ORIGIN || '*', methods: ['GET','POST'] } });

io.on('connection', (socket) => {
  console.log('client connected', socket.id);
  socket.emit('dashboard:init', state);
  socket.on('presence:join', (user) => { socket.user = user; io.emit('presence:update', { id: socket.id, user }); });
  socket.on('disconnect', () => { io.emit('presence:leave', { id: socket.id, user: socket.user || null }); });
});

app.post('/api/button/:action', (req, res) => {
  const action = req.params.action;
  const payload = req.body || {};
  const timestamp = new Date().toISOString();
  state.lastUpdate = { action, payload, timestamp };
  state.data[action] = (state.data[action] || 0) + 1;
  io.emit('dashboard:update', { action, payload, state });
  return res.json({ ok: true, action, state });
});

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
