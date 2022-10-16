// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import {resourceSchema} from "./constant";
import { TimeLineNote } from './services/timelinenote';

const matchableFileTypes: string[] = ['tn'];
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const openedPanelMap = new Map<string, boolean | undefined | null>();
	let isFirstActivate: boolean = true;
	let timer: any = null;
	let disposable = vscode.commands.registerTextEditorCommand('extension.timelinenote', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const onDiskPath = vscode.Uri.file(
			path.join(context.extensionPath, 'webui', "timelinenote.html")
		);
		const resourcePath = vscode.Uri.file(
			path.join(context.extensionPath, "webui")
		);
		const fileContent = process.platform === "win32"
			? fs.readFileSync(onDiskPath.path.slice(1)).toString()
			: fs.readFileSync(onDiskPath.path).toString();
		const resouceRealPath = resourcePath.with({scheme:resourceSchema});
		const html = fileContent.replace(
			/\$\{vscode}/g,
			resouceRealPath.toString()
		);
		const editor:vscode.TextEditor | undefined = vscode.window.activeTextEditor;		
		const fileName = (<vscode.TextEditor>editor).document.fileName;
		const basename = path.basename(fileName);
		const extName = path.extname(fileName);
		const timelinenoteService = new TimeLineNote(fileName);
		const importData = getImportData(fileName, extName, timelinenoteService) ||{};
		if (!matchableFileTypes.includes(extName.slice(1))) {
			return;
		}

		const panel = createWebviewPanel(basename);
		panel.webview.html = html;
		panel.webview.onDidReceiveMessage(message=>{
			let destFileName = '';
			switch (message.command){
				case 'loaded':
					panel.webview.postMessage(
						{
							command:"import",
							importData,
							extName
						}
					);
					return;
				case "save":
					const retData = JSON.parse(message.exportData);
					destFileName =
						extName === ".timelinenote"
							? fileName.replace(/(\.timelinenote)/, 'tn')
							: fileName;
					writeFileToDisk(destFileName, JSON.stringify(retData, null, 4));
			}
		},
		undefined,
		context.subscriptions
		);

		panel.onDidDispose(
			() =>{

			},
			null,
			context.subscriptions
		);
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
		"aa"//(vscode.window.activeTextEditor as vscode.TextEditor).document.fileName
	);
	context.subscriptions.push(disposable);
	vscode.workspace.onDidOpenNotebookDocument(e => {
		console.log("in onDidOpenNotebookDocument");
	});
	vscode.workspace.onDidCloseTextDocument(e => {
		console.log("in onDidCloseTextDocument");
	});
}

// this method is called when your extension is deactivated
export function deactivate() { }


function createWebviewPanel(fileName:string){
	return vscode.window.createWebviewPanel(
		'timelinenote',
		`${fileName}-timelinenote`,
		vscode.ViewColumn.One,
		{
			enableScripts:true,
			retainContextWhenHidden:true
		}
	);
}

function getImportData(fileName:string, extName:string, timelinenote: TimeLineNote){
	if(extName === '.tn'){
		return JSON.stringify(timelinenote.process());
	}
	return fs.readFileSync(fileName).toString();
}

function writeFileToDisk(fileName: string, data:any){
	fs.writeFile(fileName, data, (err:any) =>{
		if(err){
			vscode.window.showErrorMessage(`write ${fileName} failed`);
			console.log(err);
			throw err;
		}
		vscode.window.showInformationMessage(`write ${fileName} successed`);
	});
}