'use strict';

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { memoConfigure } from './memoConfigure';
import { memoInit }from './memoInit';
import { memoNew } from './memoNew';
import { memoEdit } from './memoEdit';
import { memoGrep } from './memoGrep';
import { memoConfig } from './memoConfigEditor';
import { memoRedate } from './memoRedate';
import { memoTodo } from './memoTodo';
import { memoServe } from './memoServe';
import { memoOpenFolder } from './memoOpenFolder';
import { memoOpenChrome } from './memoOpenChrome';
import { memoOpenTypora } from './memoOpenTypora';
// import { MemoTreeProvider } from './memoTreeProvider';

// import {MDDocumentContentProvider, isMarkdownFile, getMarkdownUri, showPreview} from './MDDocumentContentProvider'

// const localize = nls.config({ messageFormat: nls.MessageFormat.file })();

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscode-memo-life-for-you" is now active!');
    // console.log(vscode.env);
    // console.log(path.normalize(path.join(vscode.env.appRoot, "node_modules", "vscode-ripgrep", "bin", "rg")));
    // console.log('vscode.Markdown =', vscode.extensions.getExtension("Microsoft.vscode-markdown").extensionPath);

    new memoInit();
    let memoedit = new memoEdit();
    let memogrep = new memoGrep();

    // const treeViewProvider = new MemoTreeProvider(); // constructor に list2 を引数として渡すために、このような実装になっている.
    // console.log(treeViewProvider);
    // vscode.window.registerTreeDataProvider('satokaz', treeViewProvider);

    context.subscriptions.push(vscode.commands.registerCommand("extension.memoNew", () => new memoNew().New()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoQuick", () => new memoNew().QuickNew()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoEdit", () => memoedit.Edit()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoGrep", () => memogrep.Grep()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoConfig", () => new memoConfig().Config()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoServe", () => new memoServe().Serve()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoReDate", () => new memoRedate().reDate()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoTodo", () => new memoTodo().TodoGrep()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoOpenFolder", () => new memoOpenFolder().OpenDir()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoOpenChrome", () => new memoOpenChrome().OpenChrome()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoOpenTypora", () => new memoOpenTypora().OpenTypora()));
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
        new memoConfigure().updateConfiguration();
    }));

    // vscode.commands.registerCommand('favorites.refresh', () => treeViewProvider.refresh());

    
//Markdown
// 	let provider = new MDDocumentContentProvider(context);
//     let registration = vscode.workspace.registerTextDocumentContentProvider('markdown', provider);

//     context.subscriptions.push(vscode.commands.registerCommand('extension.MemoshowPreviewToSide', uri => showPreview(uri, true)));

//     vscode.workspace.onDidSaveTextDocument(document => {
// 		if (isMarkdownFile(document)) {
// 			const uri = getMarkdownUri(document.uri);
// 			provider.update(uri);
// }
//     });
//     vscode.workspace.onDidChangeTextDocument(event => {
// 		if (isMarkdownFile(event.document)) {
// 			const uri = getMarkdownUri(event.document.uri);
// 			provider.update(uri);

// 		}
// 	});

// 	vscode.workspace.onDidChangeConfiguration(() => {
// 		vscode.workspace.textDocuments.forEach(document => {
// 			if (document.uri.scheme === 'markdown') {
// 				// update all generated md documents
// 				provider.update(document.uri);
// 			}
// 		});
// 	});
// Markdown
}

export function deactivate() {
}
