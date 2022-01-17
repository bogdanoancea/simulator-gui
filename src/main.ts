//process.env.NODE_ENV = "development";
 process.env.NODE_ENV = 'production';

import { app, BrowserWindow, dialog, ipcMain } from "electron";
import * as path from "path";
import * as fs from 'fs';


import {spawn} from "node-pty";

import * as xml2js from 'xml2js';
import * as cp from 'child_process'
import * as os from 'os';

let mapFile:string  = null;
let simulationFile:string  = null;
let personsFile:string  = null;
let antennasFile:string  = null;
let simulator_path:string = null;
let outout_folder:string = null;

// ============================================================
let mainWindow: BrowserWindow = null;
// let reportWindow = null;

function createWindow(): void {
	// Create the browser window.

	let iconPath = path.join(__dirname, "../src/assets/icon.png");
	if (process.env.NODE_ENV !== "development") {
		iconPath = path.join(path.resolve(__dirname), "../../assets/icon.png");
	}

	mainWindow = new BrowserWindow({
		width: 1024,
		height: 768,
		minWidth: 1024,
		minHeight: 768,
		backgroundColor: "#fff",
		icon: iconPath,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
		},
	});

	// and load the index.html of the app.
	mainWindow.loadFile(path.join(__dirname, "../index.html"));
	mainWindow.setMenuBarVisibility(false)
	
	if (process.env.NODE_ENV !== "development") {
		mainWindow.removeMenu();
	}

	if (process.env.NODE_ENV === "development") {
		// Open the DevTools.
		mainWindow.webContents.openDevTools();
	}


}

// app.disableHardwareAcceleration();

app.whenReady().then(() => {
	createWindow();

});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
	// if (process.platform !== 'darwin') {
	//proc.kill()
	app.quit();
	// }
});
app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();

	}
});
// ============================================================

// change window - check if authenticated
ipcMain.on("changeWindow", (event, args) => {
	const newPage = path.join(__dirname, "../src/page/" + args.name + ".html");
	switch (args.name) {
		case "index":
			mainWindow.loadURL("file://" + __dirname + "../../index.html");
			break;
		default:
			mainWindow.loadURL("file://" + newPage);
	}
});



ipcMain.on("map_file", (event, args) => {
	dialog.showOpenDialog(mainWindow, {
		properties: ['openFile']
	  }).then(result => {
		if(!result.canceled)
			mapFile = result.filePaths[0];
	  }).catch(err => {
		console.log(err)
	  })
});


ipcMain.on("simulation_file", (event, args) => {
	dialog.showOpenDialog(mainWindow, {
		properties: ['openFile']
	}).then(result => {
		if(!result.canceled)
			simulationFile = result.filePaths[0];
			var parser:any = new xml2js.Parser();
			fs.readFile(simulationFile, function(err, data) {
				parser.parseString(data, function (err:any, result:any) {
					var odir: string = result.simulation.output_dir[0];
					if(odir != undefined)
						outout_folder = odir;
					else
						outout_folder = "output";
				});
			});
		
	  }).catch(err => {
		console.log(err)
	  })

	
});


ipcMain.on("persons_file", (event, args) => {
	dialog.showOpenDialog(mainWindow, {
		properties: ['openFile']
	  }).then(result => {
		if(!result.canceled)
			personsFile = result.filePaths[0];
	  }).catch(err => {
		console.log(err)
	  })
});

ipcMain.on("antennas_file", (event, args) => {
	dialog.showOpenDialog(mainWindow, {
		properties: ['openFile']
	  }).then(result => {
		if(!result.canceled)
			antennasFile = result.filePaths[0];
	  }).catch(err => {
		console.log(err)
	  })

});

ipcMain.on("simulator_path", (event, args) => {
	dialog.showOpenDialog(mainWindow, {
		properties: ['openDirectory']
	  }).then(result => {
		if(!result.canceled) {
			simulator_path = result.filePaths[0];
			fs.writeFileSync('config.json', simulator_path);
			console.log(simulator_path);
		}
	  }).catch(err => {
		console.log(err)
	  })

});


ipcMain.on("run_simulation", (event, args) => {
	let proc:any = null;
	if(process.platform == 'win32')
			proc = spawn('cmd.exe', [], {
			name: 'xterm-color',
			cols: 180,
			rows: 50,
			cwd: process.env.HOME,
			env: process.env
		});
	else {
		proc = spawn('sh', [], {
			name: 'xterm-color',
			cols: 180,
			rows: 50,
			cwd: process.env.HOME,
			env: process.env
		});
	}

	
	if(simulator_path === null && fs.existsSync('config.json')) {
		simulator_path = fs.readFileSync('config.json').toString();
	}
	if (simulator_path === null) {
		const options = {
			type: 'info',
			buttons: ['OK'],
			defaultId: 1,
			title: 'Information',
			message: 'Set the path to the simulation software!',
		  };
		
		dialog.showMessageBoxSync(mainWindow, options);
		return;
	}

	if (mapFile === null) {
		const options = {
			type: 'info',
			buttons: ['OK'],
			defaultId: 1,
			title: 'Information',
			message: 'Select the map file!',
		  };
		
		dialog.showMessageBoxSync(mainWindow, options);
		return;
	}

	if (simulationFile === null) {
		const options = {
			type: 'info',
			buttons: ['OK'],
			defaultId: 1,
			title: 'Information',
			message: 'Select the simulation configuration file!',
		  };
		
		dialog.showMessageBoxSync(mainWindow, options);
		return;
	}

	if (personsFile === null) {
		const options = {
			type: 'info',
			buttons: ['OK'],
			defaultId: 1,
			title: 'Information',
			message: 'Select the persons configuration file!',
		  };
		
		dialog.showMessageBoxSync(mainWindow, options);
		return;
	}
	if (antennasFile === null) {
		const options = {
			type: 'info',
			buttons: ['OK'],
			defaultId: 1,
			title: 'Information',
			message: 'Select the antennas configuration file!',
		  };
		
		dialog.showMessageBoxSync(mainWindow, options);
		return;
	}
	let simulator_exe:string = null;
	if(process.platform == 'win32')
		simulator_exe = "simulator.exe";
	else
		simulator_exe = 'simulator';
	if(!fs.existsSync(path.join(simulator_path, simulator_exe) )) {
		const options = {
			type: 'info',
			buttons: ['OK'],
			defaultId: 1,
			title: 'Information',
			message: 'Check the executable file!',
		  };
		
		dialog.showMessageBoxSync(mainWindow, options);
		return;
	}
	console.log(simulator_path);
	let cdircmd : string = null;
	if(process.platform == 'win32')
		cdircmd = "cd /d " + os.homedir() + "\r";
	else
		cdircmd = "cd " + os.homedir() + "\r";
	proc.write(cdircmd);
	let cmdLine:string = "\"" + path.join(simulator_path, simulator_exe) + "\"" + " -m " + "\"" + mapFile + "\"" + " -s " + "\"" + simulationFile + "\"" + " -a " + "\"" + antennasFile + "\"" +" -p " + "\"" + personsFile + "\""+ "\r";
	proc.write(cmdLine);

	proc.onData((data:any) => {
		mainWindow.webContents.send("terminal-incData", data);
	  });
  
	// ipcMain.on("terminal-into", (event, data)=> {
	// 	proc.write(data);
	// })

	const exitDisposable = proc.onExit(() => {
		//disposable.dispose();
		exitDisposable.dispose();
	})
	
});

ipcMain.on("open_output", (event, args) => {
	if(outout_folder != null && process.platform == 'win32')
		cp.exec("start "+ path.join(os.homedir(), outout_folder) );
	else if (outout_folder != null && process.platform == 'darwin') {
		cp.exec("open "+ path.join(os.homedir(), outout_folder) );
	}
	else {
		const options = {
			type: 'info',
			buttons: ['OK'],
			defaultId: 1,
			title: 'Information',
			message: 'Run a simulation first!',
		  };
		
		dialog.showMessageBoxSync(mainWindow, options);
	}

});






