'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscode-memo-life-for-you" is now active!');

    let memo = new Memo();

    context.subscriptions.push(vscode.commands.registerCommand("extension.memoNew", () =>  memo.New()));
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
    private memoListChannel: vscode.OutputChannel;
    private memoGrepChannel: vscode.OutputChannel;    
    private memopath: string; 
    private memoaddr: string;
    private memodir: string;
    private isNative: string;
    private insertTime: string;
    private isEnabled: boolean = false;
    private memoConfig = [];

    public options: vscode.QuickPickOptions = {
        ignoreFocusOut: true,
        matchOnDescription: true,
        matchOnDetail: true,
        placeHolder: ''
    }

    public cp_options = {
        maxBuffer: 1024 * 1024
    }
    
    constructor() {
        this.memoListChannel = vscode.window.createOutputChannel("Memo List");
        this.memoGrepChannel = vscode.window.createOutputChannel("Memo Grep");
        this.updateConfiguration();
        this.readConfig();        
    }
    
    public New() {
        let file: string;
        let date: Date = new Date();
        let dateFormat: string = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
        let time: string = ('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2);
        // console.log(dateFormat);
        // console.log(time);

        vscode.window.showInputBox({placeHolder: 'Please Enter a Filename'}).then(
            (title) => {
                if (title == "") {
                    file = dateFormat + ".md";
                } else {
                    file = dateFormat + '-' + (this.insertTime === 'true' ? time + '-' : '') + title
                    .replace(/[\s\]\[\!\"\#\$\%\&\'\(\)\*\/\:\;\<\=\>\?\@\\\^\{\|\}\~\`]/g, '-')
                    .replace(/--+/g ,'') + ".md";
                }
                file = path.normalize(path.join(this.memodir, file));
                // console.log("isExist =", file);

                try {
                    fs.statSync(file);
                } catch(err) {
                    fs.writeFileSync(file, `# ${dateFormat} ${title}` + "\n\n");  
                }
                
                vscode.workspace.openTextDocument(file).then(document=>{
                    // console.log('uri =', document.uri.toString()); // uri = file:///Users/satokaz/.config/memo/2017-10-15.md
                    let editor = vscode.window.activeTextEditor;
                    vscode.window.showTextDocument(document, vscode.ViewColumn.One, false);
                });
                // }
            }
        );
    }

    public Edit() {
        let memopath = this.memopath;
        let memodir = this.memodir;

        // let memodir = path.normalize(vscode.workspace.getConfiguration('memo-life-for-you').get<string>('memoDir'));
        // console.log("memodir = ", memodir)

        let memoChannel = vscode.window.createOutputChannel('Memo List');
        
        let list = cp.execSync(`${this.memopath} list`, this.cp_options).toString().split('\n');
        
        // console.log('list =', list);
        let items: vscode.QuickPickItem[] = [];
        
        for (let index = 0; index < list.length; index++) {
            // let v = list[index];

            if (list[index] == '') {
                break;
            }

            let array = fs.readFileSync(path.normalize(path.join(this.memodir, list[index]))).toString().split("\n");

            items.push({ 
                "label": list[index], 
                "description": array[0], 
                "detail": "" });
            
            this.memoListChannel.appendLine('file://' + path.join(this.memodir, list[index]) + `\t` + array[0]);
            this.memoListChannel.appendLine('');
        }
        this.memoListChannel.show();

        // console.log("items =", items)
        
        this.options.placeHolder = 'Please select or enter a filename...';
        vscode.window.showQuickPick(items, this.options).then(function (selected) {
            
            if (selected == null) {
                return;
            }
            
            vscode.workspace.openTextDocument(path.normalize(path.join(memodir, selected.label))).then(document=>{
                vscode.window.showTextDocument(document, vscode.ViewColumn.One, false);
            });
        });
    }

    // memo grep
    public Grep() {
        let items: vscode.QuickPickItem[] = [];
        
        vscode.window.showInputBox({placeHolder: 'Please enter a keyword'}).then(
            (keyword) => {
                this.memoGrepChannel.clear();
                keyword = keyword.replace(/\s/g, '\ ');
                // console.log('name =', keyword);                

                let list = cp.execSync(`${this.memopath} grep ${keyword}`, this.cp_options).toString().split('\n');
                // console.log(list);
                // console.log("list.length =", list.length);

                for (let index = 0; index < list.length; index++) {
                    // let v = list[index];

                    if (list[index] == '') {
                        break;
                    }

                    let vsplit = list[index].split(":", 2);
                    let vdetail = (list[index].match(/^(.*?)(?=:)/gm)).toString();

                    items.push({ 
                        "label": list[index].replace(/^(.*?)(?=:)/gm, '').replace(/^:/g, 'Line ').toString(),
                        "description": "", 
                        "detail": vsplit[0]
                    });
                    // console.log(items[i]);

                    this.memoGrepChannel.appendLine(`${index}: ` + 'file://' + vsplit[0] + (process.platform == 'linux' ? ":" : "#") + vsplit[1]);
                    this.memoGrepChannel.appendLine(list[index].replace(/^(.*?)(?=:)/gm, '').replace(/^:/g, 'Line ').toString());
                    this.memoGrepChannel.appendLine('');
                }
                this.memoGrepChannel.show();                
                
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
                            editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenter);
                        });
                    });
                });
            });
    }

    public Config() {
        this.readConfig();
        vscode.workspace.openTextDocument(path.normalize(path.join(this.memodir, 'config.toml'))).then(document=>{
            vscode.window.showTextDocument(document, vscode.ViewColumn.One, false);
        });
    }

    public readConfig() {
        let editor;
        let memodir;
        let list = cp.execSync(`${this.memopath} config --cat`, this.cp_options).toString().split('\n');

        list.forEach(async function (v, i) {
            // console.log(v.split("=")[1]);
            if (v.match(/memodir =/)) {
                memodir = v.split("=")[1].replace(/"/g, "").trim();
            }
            if (v.match(/editor =/)) {
                editor = v.split("=")[1].replace(/"/g, "").trim();
                console.log("editor =", editor);
            }
        });
        
        this.memodir = memodir;
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
        // this.memodir = path.normalize(vscode.workspace.getConfiguration('memo-life-for-you').get<string>('memoDir'));
        this.isNative = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('nativeNew');
        this.insertTime = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('insertTimeInFilename');
    }
}
