import { app, BrowserWindow, ipcMain } from 'electron'
import path from "path"
import fs from "fs"

const createWindow = () => {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			webSecurity: false,
			preload: path.join(process.cwd(), 'preload.js'),
			// preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
			nodeIntegration: true,
		}
	})

	win.loadFile('index.html')
}

app.whenReady().then(() => {
	ipcMain.handle('ping', () => fs.readFileSync(path.join(process.cwd(), "data.json"), { encoding: "utf8" }))
	createWindow()
})
