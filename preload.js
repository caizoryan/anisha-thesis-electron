const { contextBridge, ipcRenderer } = require('electron')

// const path = require("path")
//
// let p = path.join(process.cwd(), 'data.json')
// let data = fs.readFileSync(p, { encoding: "utf8" })

contextBridge.exposeInMainWorld('versions',
  {
    fucker: () => "ass",
    data: () => ipcRenderer.invoke("ping")
  })
