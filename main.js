import { app, BrowserWindow, ipcMain } from 'electron'
import path from "path"
import fs from "fs"

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

	mainwindow.webContents.session.on('select-serial-port', (event, portList, webContents, callback) => {
		console.log("trying to select?")
		// Add listeners to handle ports being added or removed before the callback for `select-serial-port`
		// is called.
		mainwindow.webContents.session.on('serial-port-added', (event, port) => {
			console.log('serial-port-added FIRED WITH', port)
			// Optionally update portList to add the new port
		})

		mainwindow.webContents.session.on('serial-port-removed', (event, port) => {
			console.log('serial-port-removed FIRED WITH', port)
			// Optionally update portList to remove the port
		})

		event.preventDefault()

		if (portList && portList.length > 0) {
			let find = portList.find(e => e.portName.includes("usbmodem"))
			if (!find) return
			console.log(portList)
			callback(find.portId)
		} else {
			// eslint-disable-next-line n/no-callback-literal
			callback('') // Could not find any matching devices
		}
	})

	mainwindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
		if (permission === 'serial' && details.securityOrigin === 'file:///') {
			return true
		}

		return false
	})

	mainwindow.webContents.session.setDevicePermissionHandler((details) => {
		if (details.deviceType === 'serial' && details.origin === 'file://') {
			return true
		}

		return false
	})

}

app.whenReady().then(() => {
	ipcMain.handle('ping', () => fs.readFileSync(path.join(process.cwd(), "data.json"), { encoding: "utf8" }))
	createWindow()
})

// const port = new SerialPort({
// 	path: '/dev/cu.usbmodem101',
// 	baudRate: 9600,
// }).setEncoding('utf8');;
//
// let data = {}
//
// function safeParse(data) {
// 	try {
// 		return JSON.parse(data)
// 	} catch (e) {
// 		return null
// 	}
// }
//
// function updateSockets() {
// 	// mainwindow.webContents.send('data', data)
// 	// Object.keys(sockets).forEach((key) => {
// 	// 	sockets[key].send(JSON.stringify(data))
// 	// })
// }
//
// const parser = new ReadlineParser({ delimiter: '\n' })
// port.pipe(parser)
// parser.on('data', (d) => {
// 	let obj = safeParse(d)
// 	if (obj) {
// 		data.x = obj.x
// 		data.y = obj.y
// 		data.pressed = obj.pressed
// 	}
//
// 	console.log("data", data)
// 	updateSockets()
// })
//
// port.on("open", () => { console.log('serial port open'); });
