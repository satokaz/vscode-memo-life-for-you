'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as randomEmoji from 'random-emoji';
import * as dateFns from 'date-fns';
import * as tomlify from 'tomlify-j0.4';
import * as nls from 'vscode-nls';
import * as os from 'os';
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


// import {MDDocumentContentProvider, isMarkdownFile, getMarkdownUri, showPreview} from './MDDocumentContentProvider'

const localize = nls.config(process.env.VSCODE_NLS_CONFIG)();

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscode-memo-life-for-you" is now active!');
    // console.log(vscode.env);

    // console.log(path.normalize(path.join(vscode.env.appRoot, "node_modules", "vscode-ripgrep", "bin", "rg")));
    // console.log('vscode.Markdown =', vscode.extensions.getExtension("Microsoft.vscode-markdown").extensionPath);

    new memoInit();
    let memoedit = new memoEdit();
    let memogrep = new memoGrep();

    context.subscriptions.push(vscode.commands.registerCommand("extension.memoNew", () => new memoNew().New()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoQuick", () => new memoNew().QuickNew()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoEdit", () => memoedit.Edit()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoGrep", () => memogrep.Grep()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoConfig", () => new memoConfig().Config()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoServe", () => new memoServe().Serve()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoReDate", () => new memoRedate().reDate()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoTodo", () => new memoTodo().Todo()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoOpenFolder", () => new memoOpenFolder().OpenDir()));    
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
        new memoConfigure().updateConfiguration();
    }));

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
