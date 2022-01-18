import { ipcRenderer } from "electron";
import * as path from "path";

window.addEventListener("DOMContentLoaded", () => {
	const file = path.basename(location.href);

	if (file === "index.html") {
		const indexFile = async () => {
			return await import("./preload/index");
		};

		indexFile();
	}

		// go to select action
	
	// ============================================
});
