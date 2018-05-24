'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as nls from 'vscode-nls';
import * as fs from 'fs';
import * as os from 'os';
import { items, memoConfigure } from './memoConfigure';

const localize = nls.config(process.env.VSCODE_NLS_CONFIG)();

export class memoTodo extends memoConfigure  {
    private _disposable: vscode.Disposable;
    private memoTodoChannel: vscode.OutputChannel;

    constructor() {
        super();
        this.memoTodoChannel = vscode.window.createOutputChannel("Memo Todo");
    }

    /**
     * Grep
     * Implementation using bundled ripgrep
     * macOS: /Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/node_modules/vscode-ripgrep/bin/rg
     * win32:
     * Linux:
    */
    public TodoGrep() {
        let items: items[] = [];
        let list: string[] = [];
        let grepLineDecoration: vscode.TextEditorDecorationType;
        let grepKeywordDecoration: vscode.TextEditorDecorationType;
        let rgPath: string;
        let args: string[];
        let result: string = ""; // "" で初期化しておかないと result += hoge で先頭に undefined が入ってしまう
        let child: cp.ChildProcess;
        let keyword = this.memoTodoUserePattern;    // '^.*@todo.*?:'

        // ASAR
        if (fs.existsSync(path.normalize(path.join(vscode.env.appRoot, "node_modules.asar.unpacked")))) {
            // vscode 12.1 or later
            rgPath = path.normalize(path.join(vscode.env.appRoot, "node_modules.asar.unpacked", "vscode-ripgrep", "bin", "rg"));
        } else if (fs.existsSync(path.normalize(path.join(vscode.env.appRoot, "node_modules")))) {
            // vscode 12.0
            rgPath = path.normalize(path.join(vscode.env.appRoot, "node_modules", "vscode-ripgrep", "bin", "rg"));
        }

        this.readConfig();

        // todo-tree.regex
        // keyword = vscode.workspace.getConfiguration('todo-tree').get<string>('regex');
        // console.log('keyword =', keyword);
        // var RegexParser = require("regex-parser");
        // console.log('RegexParser =', RegexParser("/((//|#|<!--|;|/\*)\s*($TAGS)|^\s*- \[ \])/g").toString());

        
        // Progress
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: localize('todoStart', "Start search..."),
                cancellable: true,
            }, async (progress, token) => {
                token.onCancellationRequested(() => {
                    if (child) {
                        child.kill();
                    }
                });
                return new Promise((resolve, reject) => {
                    progress.report({ message: localize('todoProgress', "Searching for Todo. . .: {0}...", keyword)});
                    // progress.report({ increment: 100 });

                    // console.log('memoGrepUseRipGrepConfigFile =', this.memoGrepUseRipGrepConfigFile);
                    // console.log('memoGrepUseRipGrepConfigFilePath =', this.memoGrepUseRipGrepConfigFilePath);

                    // console.log('memoGrep =', process.env.RIPGREP_CONFIG_PATH);
                    args = ['--vimgrep', '--color', 'never', '-g', '*.md', '-S', '-r', 'TODO: '];
                    child = cp.spawn(rgPath, args.concat([keyword]).concat([this.memodir]), {
                                    stdio: ['inherit'],
                                    cwd: this.memodir,
                                    env: process.env.RIPGREP_CONFIG_PATH = ''
                                });
                        
                    child.stdout.setEncoding('utf-8');
                    child.stdout.on("data", (message) => {
                        // console.log('stdout =', message);
                        result += message;
                        // console.log('result =', result);
                        
                    });

                    child.stderr.setEncoding('utf-8');
                    child.stderr.on("data", (message) => {
                        // console.log(message);
                    });

                    child.on("close", async (code) => {
                        // console.log(code);
                        // console.log(result);
                        if (code == 0) {
                                // list = result.split('\n').sort(function(a, b) {
                            list = result.split('\n').sort(function(a, b) {
                                return (a > b ? 1 : -1); // 古い日付から表示する
                            });
                            resolve();
                        } else {
                            vscode.window.showErrorMessage(localize('todoNoResult', 'Todo not found...'));
                            reject();
                        }
                    });

                });
            }).then(() => {
            // console.log('result =', list);
            list.forEach((vlist, index) => {
                if (vlist == '') {
                    return;
                }
                // console.log(vlist);

                let filename: string = vlist.match((process.platform == "win32") ? /^(.*?)(?=:).(.*?)(?=:)/gm : /^(.*?)(?=:)/gm).toString();;
                // console.log("filename =", filename);

                let line: number = Number(vlist.replace((process.platform == "win32") ? /^(.*?)(?=:).(.*?)(?=:)/gm : /^(.*?)(?=:)/gm, "")
                .replace(/^:/gm, "").match(/^(.*?)(?=:)/gm).toString());
                // console.log("line =", line);

                let col: number = Number(vlist.replace((process.platform == "win32") ? /^(.*?)(?=:).(.*?)(?=:)/gm : /^(.*?)(?=:)/gm, "")
                .replace(/^:/gm, "").replace(/^(.*?)(?=:)/gm, "").replace(/^:/gm, "").match(/^(.*?)(?=:)/gm).toString());
                // console.log("col =", col);

                let result = vlist.replace((process.platform == "win32") ? /^(.*?)(?=:).(.*?)(?=:).(.*?)(?=:).(.*?)(?=:):/gm : /^(.*?)(?=:).(.*?)(?=:).(.*?)(?=:):/gm, "").toString();
                // console.log("result =", result);

                items.push({
                    "label": `$(issue-opened) ` + result,
                    // "description": 'due: ',
                    "detail": `$(calendar) ` + path.basename(filename),
                    "ln": line,
                    "col": col,
                    "index": index,
                    "filename": filename,
                    "isDirectory": false,
                    "birthtime": null,
                    "mtime": null
                });

                this.memoTodoChannel.appendLine(`${index}: ` + 'file://' + filename + (process.platform == 'linux' ? ":" : "#") + line + ':' + col );
                this.memoTodoChannel.appendLine(result);
                // this.memoTodoChannel.appendLine(vlist.replace(/^(.*?)(?=:)/gm, '').replace(/^:/g, 'Line ').toString());
                this.memoTodoChannel.appendLine('');
            });

            vscode.window.showQuickPick<items>(items, {
                ignoreFocusOut: true,
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: localize('todoResult', 'Todo Result: {0} ... (Number of results: {1})', keyword, items.length),
                onDidSelectItem: async (selected: items) => {
                    if (selected == undefined || selected == null ) {
                        grepLineDecoration.dispose();
                        grepKeywordDecoration.dispose();
                        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                        return void 0;
                    }
                    // console.log('selected.label =', selected.label);
                    // console.log('selected =', selected)

                    vscode.workspace.openTextDocument(selected.filename).then(document => {
                        vscode.window.showTextDocument(document, {
                            viewColumn: 1,
                            preserveFocus: true,
                            preview: true
                        }).then(async document => {
                            // カーソルを目的の行に移動させて表示する為の処理
                            const editor = vscode.window.activeTextEditor;
                            const position = editor.selection.active;
                            const newPosition = position.with(Number(selected.ln) - 1 , Number(selected.col) -1);
                            // カーソルで選択 (ここでは、まだエディタ上で見えない)
                            editor.selection = new vscode.Selection(newPosition, newPosition);

                            // highlight decoration
                            if (grepLineDecoration && grepKeywordDecoration) {
                                grepLineDecoration.dispose();
                                grepKeywordDecoration.dispose();
                            }

                            let startPosition = new vscode.Position(Number(selected.ln) - 1 , 0);
                            let endPosition = new vscode.Position(Number(selected.ln), 0);

                            // Line Decoration
                            grepLineDecoration = vscode.window.createTextEditorDecorationType( <vscode.DecorationRenderOptions> {
                                isWholeLine: true,
                                gutterIconPath: this.memoWithRespectMode == true ? path.join(__filename, '..', '..', '..', 'resources', 'Q2xhdWRpYVNEM3gxNjA=.png')
                                    : (this.memoGutterIconPath ? this.memoGutterIconPath
                                    : path.join(__filename, '..', '..', '..', 'resources', 'sun.svg')),
                                gutterIconSize: this.memoGutterIconSize ? this.memoGutterIconSize : '100% auto',
                                backgroundColor: this.memoGrepLineBackgroundColor
                            });
                            // Keyword Decoration
                            let startKeywordPosition = new vscode.Position(Number(selected.ln) - 1, Number(selected.col) - 1);
                            let endKeywordPosition = new vscode.Position(Number(selected.ln) -1, Number(selected.col) + keyword.length - 1);
                            grepKeywordDecoration = vscode.window.createTextEditorDecorationType( <vscode.DecorationRenderOptions> {
                                isWholeLine: false,
                                backgroundColor: this.memoGrepKeywordBackgroundColor
                            });
                            editor.setDecorations(grepLineDecoration, [new vscode.Range(startPosition, startPosition)]);
                            editor.setDecorations(grepKeywordDecoration, [new vscode.Range(startKeywordPosition, endKeywordPosition)]);

                            // カーソル位置までスクロール
                            editor.revealRange(editor.selection, vscode.TextEditorRevealType.Default);
                        });
                    });
                }
            }).then(async (selected) => {   // When selected with the mouse
                if (selected == undefined || selected == null) {
                    grepLineDecoration.dispose();
                    grepKeywordDecoration.dispose();
                    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    return void 0;
                }
                vscode.workspace.openTextDocument(selected.filename).then(document => {
                    vscode.window.showTextDocument(document, {
                        viewColumn: 1,
                        preserveFocus: true,
                        preview: true
                    }).then(document => {
                        // カーソルを目的の行に移動させて表示する為の処理
                        const editor = vscode.window.activeTextEditor;
                        const position = editor.selection.active;
                        const newPosition = position.with(Number(selected.ln) - 1 , Number(selected.col) -1);
                        // カーソルで選択 (ここでは、まだエディタ上で見えない)
                        editor.selection = new vscode.Selection(newPosition, newPosition);
                        // カーソル位置までスクロール
                        editor.revealRange(editor.selection, vscode.TextEditorRevealType.Default);
                    });
                }).then(() =>{
                    // ファイルを選択した後に、decoration を消す
                    setTimeout(() => { 
                        grepLineDecoration.dispose();
                        grepKeywordDecoration.dispose();
                    }, 500);
                });
            });
        });
    }

    dispose() {
        this._disposable.dispose();
    }
}
