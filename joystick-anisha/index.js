const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')
const cors = require("cors");
const express_ws = require('express-ws');

const express = require('express')

const app = express()
express_ws(app)
app.use(cors())
app.use(express.json())

const e_port = 8881
let data = { x: 0, y: 0 }

let sockets = {}

app.ws('/data', function(ws, req) {
	console.log('socket connected')
	let uid = Math.random() * Date.now()
	sockets[uid] = ws

	ws.on('message', function(msg) {
		console.log(msg)
		Object.keys(sockets).forEach((key) => {
			sockets[key].send(JSON.stringify(data))
		})
	});
});

app.get('/', (req, res) => { })

app.listen(e_port, () => {
	console.log(`Server running on port ${e_port}`)
})


const port = new SerialPort({
	path: '/dev/cu.usbmodem1101',
	baudRate: 9600,
}).setEncoding('utf8');;


function safeParse(data) {
	try {
		return JSON.parse(data)
	} catch (e) {
		return null
	}
}

function updateSockets() {
	Object.keys(sockets).forEach((key) => {
		sockets[key].send(JSON.stringify(data))
	})
}

// const parser = port.pipe(new Readline({ delimiter: '\n' }));// Read the port data
const parser = new ReadlineParser({ delimiter: '\n' })
port.pipe(parser)
parser.on('data', (d) => {
	let obj = safeParse(d)
	if (obj) {
		data.x = obj.x
		data.y = obj.y
		data.pressed = obj.pressed
	}

	console.log("data", data)
	updateSockets()
})

port.on("open", () => {
	console.log('serial port open');
});

