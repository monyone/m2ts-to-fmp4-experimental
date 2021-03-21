#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const FluentFFmpeg = require('fluent-ffmpeg');
const ffmpeg = new FluentFFmpeg();

const EventEmitter = require("events");
const event = new EventEmitter();

const { Command } = require('commander');
const program = new Command();
program.option('-i, --input <path>', 'input file path');
program.option('-c, --chunk <sec>', 'chunk sec');
program.option('-p, --port <port>', 'websocket port');
program.parse(process.argv);
const options = program.opts();

const src = options.input == null || options.input === '-' ? process.stdin : fs.createReadStream(options.input);
const port = options.port == null || Number.isNaN(Number.parseInt(options.port)) ? 8080 : Number.parseInt(options.port);
const sec = options.chunk == null || Number.isNaN(Number.parseFloat(options.chunk)) ? 0.1 : Number.parseFloat(options.chunk)

const ws = require('ws');
const server = new ws.Server({ port });

const tmp = require('tmp');
const outputDir = tmp.dirSync();

const chokidar = require('chokidar');
chokidar.watch(path.join(outputDir.name, '*.ts')).on('add', (path) => {
  event.emit('data', fs.readFileSync(path));
})

ffmpeg
  .input(src)
  .inputFormat('mpegts')
  .inputOptions([
    `-re`,
  ])
  .output(path.join(outputDir.name, 'video.m3u8'))
  .outputFormat('hls')
  .outputOptions([
    `-sc_threshold 0`,
    `-hls_time ${sec}`,
    `-hls_flags temp_file+delete_segments`,
  ])
  .run()

server.on('connection', (socket) => {
  const listener = (chunk) => {
    socket.send(chunk);
  };
  socket.on('disconnect', () => {
    event.removeListener('data', listener);
  });
  event.on('data', listener);
})
