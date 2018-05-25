const dgram = require('dgram');
const raw = require('raw-socket');

const icmpSocket = raw.createSocket('icmp');
const udpSocket = dgram.createSocket('udp4');

const HOST = process.argv[2];
const MESSAGE = new Buffer('');
let PORT;
let ttl = 1;
let interval;
let startTime;
let replyIP;

console.log(`traceroute to ${HOST} (${HOST}), 64 hops max, 42 byte packets`);

icmpSocket.on('message', function(buffer, source) {
  let p = buffer.toString('hex').substr(100, 4);
  let portNumber = parseInt(p, 16);
  if (PORT === portNumber) {
    replyIP = source;
  }
});

udpSocket.bind(1234, () => {
  sendPacket(ttl);
});

function sendPacket(ttl) {
  startTime = Date.now();
  PORT = getRandomPort();
  if (udpSocket) {
    udpSocket.setTTL(ttl);
    udpSocket.send(MESSAGE, 0, MESSAGE.length, PORT, HOST, function(err) {
      if (err) throw err;
    });
  }
  checkReply();
}

function checkReply() {
  const elapsedTime = Date.now() - startTime;

  if (replyIP) {
    console.log(` ${ttl}  ${replyIP} ${elapsedTime} ms`);

    if (replyIP == HOST) {
      clearInterval(interval);
      process.exit();
    }
    replyIP = null;
    sendPacket(++ttl);
  } else {
    if (elapsedTime > 5000) {
      console.log(` ${ttl}   *`);
      sendPacket(++ttl);
    } else {
      setTimeout(checkReply, 100);
    }
  }
}

function getRandomPort() {
  const PORT_MIN = 33434;
  const PORT_MAX = 33534;
  return Math.floor(Math.random() * (PORT_MAX - PORT_MIN) + PORT_MIN);
}
