import * as vscode from 'vscode';
import { PythonExtension } from '@vscode/python-extension';
import * as proc from "child_process";
import path from 'node:path';

const execShell = (cmd: string, cwd: string) =>
	new Promise<string>((resolve, reject) => {
		proc.exec(
			cmd,
			{ cwd: cwd },
			(err, out) => {
				if (err) {
					return reject(err);
				}
				return resolve(out);
			},
		);
	});

async function setInterpreter() {
	let activedoc = vscode.window.activeTextEditor?.document;
	if (!activedoc) {
		return;
	}
	if (!(activedoc.fileName.toLowerCase().endsWith(".py"))) {
		return;
	}
	console.log("finding uv environment for " + activedoc.fileName);
	let env_path: string;
	let cwd = path.dirname(activedoc.fileName);
	let is_script = false;
	for (let i = 0; i < Math.min(50, activedoc.lineCount); i++) {
		if (activedoc.lineAt(i).text.toLowerCase().trim() === "# /// script") {
			is_script = true;
			break;
		}
	}
	if (is_script) {
		env_path = (await execShell("uv python find --script \"" + activedoc.fileName + "\"", cwd)).trim();
	} else {
		env_path = (await execShell("uv python find", cwd)).trim();
	}
	console.log(env_path);

	// const pythonExtension = vscode.extensions.getExtension("ms-python.python");
	// if(pythonExtension) {
	// 	await pythonExtension.activate();
	// 	const api = pythonExtension.exports;
	const api = await PythonExtension.api();
	await api.ready;
	// 	console.log(api);
	await api.environments.updateActiveEnvironmentPath(env_path);
	// }
	// vscode.window.showInformationMessage('set python interpreter:' + env_path);
}


let g_trackActiveFile: boolean;
let g_fileChangeListener: vscode.Disposable | undefined = undefined;
let g_statusBarItem: vscode.StatusBarItem;

function toggleTrackingActiveFile(activate: boolean | undefined = undefined) {
	if (activate === undefined) {
		activate = !g_trackActiveFile;
	}
	g_trackActiveFile = activate;
	if (g_trackActiveFile) {
		setInterpreter();
		g_fileChangeListener = vscode.window.onDidChangeActiveTextEditor(setInterpreter);
	} else {
		if (g_fileChangeListener) {
			g_fileChangeListener.dispose();
			g_fileChangeListener = undefined;
		}
	}
	updateStatusBarItem();
	vscode.workspace.getConfiguration().update("uvscode.autoSetInterpreter", g_trackActiveFile, vscode.ConfigurationTarget.Global).then(() => console.log("updated config"));
}

function updateStatusBarItem() {
	// Update the label and color based on the tracking state
	if (g_trackActiveFile) {
		g_statusBarItem.text = '$(check) uvscode auto (on)';
		g_statusBarItem.color = '#00FF00'; // Green color for enabled
	} else {
		g_statusBarItem.text = '$(x) uvscode auto (off)';
		g_statusBarItem.color = '#FF0000'; // Red color for disabled
	}
	g_statusBarItem.show();
}

var terminal: vscode.Terminal | undefined = undefined;

function run() {
	let activedoc = vscode.window.activeTextEditor?.document;
	if (!activedoc) {
		return;
	}
	if (!(activedoc.fileName.toLowerCase().endsWith(".py"))) {
		return;
	}
	if (terminal !== undefined) {
		if (terminal.exitStatus !== undefined) {
			terminal = undefined;
		}
	}
	if (terminal === undefined) {
		terminal = vscode.window.terminals.find(term => term.name === "uvscode");
		if (terminal === undefined) {
			terminal = vscode.window.createTerminal("uvscode");
		}
	}
	terminal.show(false);
	let p = path.resolve(activedoc.fileName + "\\..");
	terminal.sendText("cd \"" + p + "\"", true);
	terminal.sendText("uv run \"" + activedoc.fileName + "\"", true);
}

export function activate(context: vscode.ExtensionContext) {
	console.log('"uvscode" loaded!');

	// Commands have been defined in package.json

	g_trackActiveFile = vscode.workspace.getConfiguration().get("uvscode.autoSetInterpreter", true);
	g_statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);

	context.subscriptions.push(g_statusBarItem);
	g_statusBarItem.command = 'uvscode.toggleTrackingActiveFile';
	updateStatusBarItem();

	context.subscriptions.push(vscode.commands.registerCommand('uvscode.run', run));
	context.subscriptions.push(vscode.commands.registerCommand('uvscode.toggleTrackingActiveFile', toggleTrackingActiveFile));
	toggleTrackingActiveFile(g_trackActiveFile);
	context.subscriptions.push(vscode.commands.registerCommand('uvscode.setInterpreter', setInterpreter));
	if (g_trackActiveFile) {
		setInterpreter();
	}
}

export function deactivate() {
	if (g_fileChangeListener) {
		g_fileChangeListener.dispose();
	}
}
