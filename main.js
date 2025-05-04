import { app, BrowserWindow, ipcMain } from 'electron'
import path from "path"
import fs from "fs"

const createWindow = () => {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(process.cwd(), 'preload.js')
		}
	})

	win.loadFile('index.html')
}

app.whenReady().then(() => {
	ipcMain.handle('ping', () => fs.readFileSync(path.join(process.cwd(), "data.json"), { encoding: "utf8" }))
	createWindow()
})
