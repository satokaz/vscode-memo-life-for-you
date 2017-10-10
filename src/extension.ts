'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscode-memo-life-for-you" is now active!');
    
    let memo = new Memo();

    // vscode.workspace.onDidChangeConfiguration(event => {
    //     console.log('event =', event)
    // });

    context.subscriptions.push(vscode.commands.registerCommand("extension.memoNew", () => memo.New()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoEdit", () => memo.Edit()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoGrep", () => memo.Grep()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoConfig", () => memo.Config()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoServe", () => memo.Serve()));
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
        memo.updateConfiguration();
    }));
}

export function deactivate() {
}

// unused
export enum MemoConfig {
    MemoDir = "memodir",
	Editor = "editor",
	Column = "column",
	SelectCmd = "selectcmd",
	GrepCmd = "grepcmd",
	AssetsDir = "assetsdir",
	PluginsDir = "pluginsdir",
	TemplateDirFile = "templatedirfile",
	TemplateBodyFile = "templatebodyfile"
};

class Memo {
    private memopath: string; 
    private memoaddr: string;
    // private memodir: string;

    public options: vscode.QuickPickOptions = {
        ignoreFocusOut: true,
        matchOnDescription: true,
        matchOnDetail: true,
        placeHolder: ''
    }
    
    constructor() {
        this.updateConfiguration();
        // this.memopath = path.normalize(vscode.workspace.getConfiguration('memo-life-for-you').get<string>('memoPath'));
        // this.memoaddr = vscode.workspace.getConfiguration('memo-life-for-you').get<number>('serve-addr');
        
        // console.log('path =', process.env.HOME);
        // console.log('path =', process.env.USERPROFIL);
        

        
    }

    public New() {
        vscode.window.showInputBox({placeHolder: 'Please Enter a Filename'}).then(
            (fileName) => {
                // console.log('name =', fileName);
                if (fileName == undefined || "") {
                    return void 0;
                }
                if (fileName == "" && process.platform == 'win32') {
                    vscode.window.showInformationMessage('Please Enter a Filename');
                    return void 0;
                } 

                if (fileName == "") {
                    cp.exec(`echo | ${this.memopath} new`);
                } else {
                    cp.exec(`${this.memopath} new ${fileName.replace(/\s/g, "_")}`);
                }
            }
        );
    }

    public Edit() {
        // this.memodir can not be used with path.join (). Required research
        // this.memodir = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('memoDir');
        // console.log(this.memodir)

        let memodir = path.normalize(vscode.workspace.getConfiguration('memo-life-for-you').get<string>('memoDir'));

        // console.log("memodir = ", memodir)

        let list = cp.execSync(`${this.memopath} list`,{maxBuffer: 1024 * 1024}).toString().split('\n');
        
        // console.log('list =', list);
        let items: vscode.QuickPickItem[] = [];
        
        list.forEach(async function (v, i) {
            if (v == '') {
                return;
            }

            let array = fs.readFileSync(path.normalize(path.join(memodir, v))).toString().split("\n");
            // console.log('v =', v);
            
            items.push({ 
                "label": v, 
                "description": array[0], 
                "detail": "" });
        })
        // console.log("items =", items)
        
        this.options.placeHolder = 'Please select or enter a filename...';
        vscode.window.showQuickPick(items, this.options).then(function (selected) {
            if (selected == null) {
                return;
            }

            // console.log('selected =', path.normalize(path.join(memodir, selected.label)));            

            vscode.workspace.openTextDocument(path.normalize(path.join(memodir, selected.label))).then(document=>{
                vscode.window.showTextDocument(document, vscode.ViewColumn.One, false);
            });
            
        });
    }

    // memo grep
    public Grep() {
        vscode.window.showInputBox({placeHolder: 'Please enter a keyword'}).then(
            (keyword) => {
                keyword = keyword.replace(/\s/g, '\ ');
                let list = cp.execSync(`${this.memopath} grep ${keyword}`,{maxBuffer: 1024 * 1024}).toString().split('\n');
                console.log('name =', keyword);                
                // console.log(list);
                // console.log("list.length =", list.length);

                let items: vscode.QuickPickItem[] = [];

                list.forEach(function (v, i) {
                    if (v == '') {
                        return void 0;
                    }
                    // console.log('v = ', v);
                    
                    items.push({ 
                        "label": v.replace(/^(.*?)(?=:)/gm, '').toString(), 
                        "description": "", 
                        "detail": (v.match(/^(.*?)(?=:)/gm)).toString(),
                    });
                })
                // console.log("items =", items)
                
                this.options.placeHolder = 'Please Enter Keywords To Search...';
                vscode.window.showQuickPick(items, this.options).then(function (selected) {
                    if (selected == null) {
                        return void 0;
                    }
                    // console.log('selected =', selected);
                    // console.log('selected split = ', selected.label.split(':')[1]);
                    vscode.workspace.openTextDocument(selected.detail).then(document => {
                        vscode.window.showTextDocument(document, vscode.ViewColumn.One, false).then(document => { 
                            // カーソルを目的の行に移動させて表示する為の処理
                            const editor = vscode.window.activeTextEditor;
                            const position = editor.selection.active;
                            var newPosition = position.with(Number(selected.label.split(':')[1]) - 1 , 0);
                            // カーソルで選択 (ここでは、まだエディタ上で見えない)
                            editor.selection = new vscode.Selection(newPosition, newPosition);
                            // カーソル位置までスクロール
                            editor.revealRange(editor.selection, vscode.TextEditorRevealType.AtTop);
                        });
                    });
                });        
            });
    }

    public Config(): any{
        // cp.exec(`${this.memopath} config`);
        cp.spawn(`${this.memopath}`, ['config'], {
            stdio: ['ignore'],
            detached: true
        }).unref();
    }

    public Serve() {
        // console.log('Current directory: ' + process.cwd());
        // console.log(`serve --addr :` + `${this.memoaddr}`);
        let proc = cp.spawn(`${this.memopath}`, ['serve', '--addr', `:${this.memoaddr}`], {
            stdio: ['inherit'],
            detached: false,
        });

        // proc.stdout.on('data', (data) => {
        //     console.log(`stdout: ${data}`);
        // });
        
        // proc.stderr.on('data', (data) => {
        //     console.log(`stderr: ${data}`);
        // });
        // proc.on('close', (code) => {
        //     console.log(`child process exited with code ${code}`);
        // });

        // console.log("child:" + proc.pid);
    }

    public updateConfiguration() {
        this.memopath = path.normalize(vscode.workspace.getConfiguration('memo-life-for-you').get<string>('memoPath'));
        this.memoaddr = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('serve-addr');
	}
}
