import { app, BrowserWindow, ipcMain } from 'electron'
import path from "path"
import fs from "fs"
import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'

let mainwindow = undefined;
const createWindow = () => {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			webSecurity: false,
			preload: path.join(process.cwd(), 'preload.js'),
			nodeIntegration: true,
		}
	})

	win.loadFile('index.html')
	mainwindow = win
}

app.whenReady().then(() => {
	ipcMain.handle('ping', () => fs.readFileSync(path.join(process.cwd(), "data.json"), { encoding: "utf8" }))
	createWindow()
})

const port = new SerialPort({
	path: '/dev/cu.usbmodem101',
	baudRate: 9600,
}).setEncoding('utf8');;

let data = {}

function safeParse(data) {
	try {
		return JSON.parse(data)
	} catch (e) {
		return null
	}
}

function updateSockets() {
	mainwindow.webContents.send('data', data)
	// Object.keys(sockets).forEach((key) => {
	// 	sockets[key].send(JSON.stringify(data))
	// })
}

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

port.on("open", () => { console.log('serial port open'); });
