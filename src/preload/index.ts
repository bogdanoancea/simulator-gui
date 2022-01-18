import {
    ipcRenderer
} from 'electron';

import { Terminal } from 'xterm';




const term = new Terminal();


// Open the terminal in #terminal-container
term.open(document.getElementById('terminal'));

term.onData(e => {
    ipcRenderer.send("terminal-into", e);
} );

ipcRenderer.on('terminal-incData', (event, data) => {
    term.write(data);
})



document.getElementById('map_file').addEventListener('click', function showForm() {
    ipcRenderer.send('map_file', {
    });
});

document.getElementById('simulation_file').addEventListener('click', function showForm() {
    ipcRenderer.send('simulation_file', {
    });
});

document.getElementById('persons_file').addEventListener('click', function showForm() {
    ipcRenderer.send('persons_file', {
    });
});

document.getElementById('antennas_file').addEventListener('click', function showForm() {
    ipcRenderer.send('antennas_file', {
    });
});


document.getElementById('run_simulation').addEventListener('click', function showForm() {
    ipcRenderer.send('run_simulation', {
    });
});

document.getElementById('open_output').addEventListener('click', function showForm() {
    ipcRenderer.send('open_output', {
    });
});

document.getElementById('simulator_path').addEventListener('click', function showForm() {
    ipcRenderer.send('simulator_path', {
    });
});

document.getElementById('default_simulator_path').addEventListener('click', function showForm() {
    
    if ((<HTMLInputElement>this).checked)
        ipcRenderer.send('default_simulator_path', {
            name: 'path_set'
        });
    else
        ipcRenderer.send('default_simulator_path', {
            name: 'path_unset'
        });

});


ipcRenderer.on('set_default_path', function setPathChekbox(event, args) {
    if (args.name == 'set_path') {
        (<HTMLInputElement>document.getElementById('default_simulator_path')).checked = false;
    }
    else if(args.name == 'unset_path') {
        (<HTMLInputElement>document.getElementById('default_simulator_path')).checked = true;
    }

});

window.onload = () => {
    var evt_response: string = null;
    if((<HTMLInputElement>document.getElementById('default_simulator_path')).checked)
        evt_response = 'path_set';
    else
        evt_response = 'path_unset';
   ipcRenderer.on('query_default_path', (event, ...args) => {
      event.sender.send('query_default_path_reply', {name: evt_response})
    })
  }

ipcRenderer.on("startLoader", () => {
    document.body.classList.add("stop-scrolling");
    document.getElementById("loader").classList.remove("d-none");
    document.getElementById("cover").classList.remove("d-none");
});

ipcRenderer.on("clearLoader", () => {
    document.body.classList.remove("stop-scrolling");
    document.getElementById("loader").classList.add("d-none");
    document.getElementById("cover").classList.add("d-none");
});
