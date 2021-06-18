const net = require('net');
const path = require('path');

net.createServer().listen(
    path.join('\\\\?\\pipe', process.cwd(), 'myctl'));
