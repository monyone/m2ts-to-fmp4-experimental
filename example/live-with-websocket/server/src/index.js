#!/usr/bin/env node

const fs = require('fs');

const EventEmitter = require("events");
const event = new EventEmitter();


const { Command } = require('commander');
const program = new Command();
program.option('-p', '--port <port>', 'websocket port');
const options = program.opts();

const src = options.input == null || options.input === '-' ? process.stdin : fs.createReadStream(options.input);
const port = options.port == null || Number.isNaN(Number.parseInt(options.port)) ? 8080 : Number.parseInt(options.port);

const ws = require('ws');
const server = new ws.Server({ port });

src.on('data', (chunk) => {
  event.emit('data', chunk);
})

let buffer = Buffer.from([]);

server.on('connection', (socket) => {
  const listener = (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    if (buffer.length >= 1000000) {
      socket.send(buffer);
      buffer = Buffer.from([]);
    }
  };
  socket.on('disconnect', () => {
    event.removeListener('data', listener);
  });
  event.on('data', listener);
})
