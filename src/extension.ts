// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const openedPanelMap = new Map<string, boolean | undefined | null>();
	let isFirstActivate: boolean = true;
    let timer :any = null;
	let disposable = vscode.commands.registerTextEditorCommand('extension.timelinenote', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from TimeLineNote!');
	});

	const executeFirstCommand = (originFileName: string) => {
		if (isFirstActivate) {
			isFirstActivate = false;
			openedPanelMap.set(originFileName, true);
			timer = setTimeout(() => {
			vscode.commands.executeCommand("extension.timelinenote");
			}, 300);
		}
	};
	executeFirstCommand(
		(vscode.window.activeTextEditor as vscode.TextEditor).document.fileName
	);
	context.subscriptions.push(disposable);
	vscode.workspace.onDidOpenNotebookDocument(e=>{
		console.log("in onDidOpenNotebookDocument");
	});
	vscode.workspace.onDidCloseTextDocument(e=>{
		console.log("in onDidCloseTextDocument");
	});
}

// this method is called when your extension is deactivated
export function deactivate() { }
