process.env.NODE_ENV = "development";
//process.env.NODE_ENV = 'production';

import { app, BrowserWindow, dialog, ipcMain } from "electron";
import * as path from "path";
import * as fs from 'fs';


//import {spawn} from "node-pty";

import * as xml2js from 'xml2js';
import {exec} from 'child_process';
import * as os from 'os';
import {spawn} from 'child_process';

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
		iconPath = path.join(path.resolve(__dirname), "../src/assets/icon.png");
		console.log(iconPath);
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

	mainWindow.webContents.once('dom-ready', () => {
		mainWindow.webContents.send('query_default_path')
		ipcMain.once('query_default_path_reply', (event, args) => {
		  treatDefaultSim(event, args);
		})
	  })
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
		if(!result.canceled) {
			mapFile = result.filePaths[0];
			mainWindow.webContents.send("terminal-incData", 'Map file set to ' + mapFile + '\r');
		}
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
			mainWindow.webContents.send("terminal-incData", 'Simulation file set to ' + simulationFile );
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
		if(!result.canceled) {
			personsFile = result.filePaths[0];
			mainWindow.webContents.send("terminal-incData", 'Persons file set to ' + personsFile );
		}
	  }).catch(err => {
		console.log(err)
	  })
});

ipcMain.on("antennas_file", (event, args) => {
	dialog.showOpenDialog(mainWindow, {
		properties: ['openFile']
	  }).then(result => {
		if(!result.canceled) {
			antennasFile = result.filePaths[0];
			mainWindow.webContents.send("terminal-incData", 'Antennas file set to ' + antennasFile );
		}
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
			mainWindow.webContents.send('set_default_path', {name:"set_path"});
		}
	  }).catch(err => {
		console.log(err)
	  })

});

 function checkConfigFile(filename:string, messg:string):boolean {
	if (filename === null) {
		const options = {
			type: 'info',
			buttons: ['OK'],
			defaultId: 1,
			title: 'Information',
			message: messg,
		  };
		
		dialog.showMessageBoxSync(mainWindow, options);
		return false;
	}
	else 
	return true;
}

ipcMain.on("default_simulator_path", treatDefaultSim);

function treatDefaultSim(event:any, args:any): void {
	console.log("am primit " + args.name);
	var enddir:string = null;
	if(process.platform == 'win32') {
		enddir = 'win32';
	} else if(process.platform == 'darwin') {
		enddir = 'darwin';
	} else if(process.platform == 'linux') {
		enddir = 'linux';
	}
	
	if(args.name === 'path_set') {
		simulator_path = path.join(__dirname, "../src/assets", enddir);
		if (process.env.NODE_ENV !== "development") {
			simulator_path = path.join(path.resolve(__dirname), "../src/assets", enddir);
		}
	}
	else
		simulator_path = null;

}

ipcMain.on("run_simulation",  (event, args) => {
	let proc:any = null;
	let bash:string = null;
	var enddir:string = null;
	if(process.platform == 'win32') {
		enddir = 'win32';
	}
	else if(process.platform == 'darwin') {
		enddir = 'darwin';
	} else if(process.platform == 'linux') {
		enddir = 'linux';
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

	if(!checkConfigFile(mapFile,'Select the map file!' ))
		return;
	if(!checkConfigFile(simulationFile,'Select the simulation configuration file!' ))
		return;
	if(!checkConfigFile(personsFile, 'Select the persons configuration file!'))
		return;
	if(!checkConfigFile(antennasFile,'Select the antennas configuration file!' ))
		return;

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
	//console.log(simulator_path);
	mainWindow.webContents.send("startLoader");
	
	var prc = spawn(path.join(simulator_path, simulator_exe), ["-m", mapFile, "-s", simulationFile, "-a", antennasFile, "-p", personsFile], {cwd: os.homedir()});

	prc.stdout.setEncoding('utf8');
	prc.stdout.on('data', function (data:any) {
	    var str = data.toString()
	    var lines = str.split(/(\r?\n)/g);
	    //console.log(lines.join(""));
		mainWindow.webContents.send("terminal-incData", data);
	});

	prc.on('close', function (code:any) {
		mainWindow.webContents.send("clearLoader");
		let data = os.homedir() + '>';
		mainWindow.webContents.send("terminal-incData", data);
    	//console.log('process exit code ' + code);
	});


});

ipcMain.on("open_output", (event, args) => {
	if(outout_folder != null && process.platform == 'win32')
		exec("start "+ path.join(os.homedir(), outout_folder) );
	else if (outout_folder != null && process.platform == 'darwin') {
		exec("open "+ path.join(os.homedir(), outout_folder) );
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






