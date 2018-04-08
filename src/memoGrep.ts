
'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as nls from 'vscode-nls';
import * as fs from 'fs';
import * as os from 'os';
import { items, memoConfigure } from './memoConfigure';

const localize = nls.config(process.env.VSCODE_NLS_CONFIG)();

export class memoGrep extends memoConfigure  {
    private _disposable: vscode.Disposable;
    private memoGrepChannel: vscode.OutputChannel;

    constructor() {
        super();
        this.memoGrepChannel = vscode.window.createOutputChannel("Memo Grep");
    }

    /**
     * Grep
     * Implementation using bundled ripgrep
     * macOS: /Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/node_modules/vscode-ripgrep/bin/rg
     * win32:
     * Linux:
    */
    public Grep() {
        let items: items[] = [];
        let list: string[] = [];
        let grepLineDecoration: vscode.TextEditorDecorationType;
        let grepKeywordDecoration: vscode.TextEditorDecorationType;
        let rgPath: string;
        let args:string[];
        let result;
        
        // ASAR
        if (fs.existsSync(path.normalize(path.join(vscode.env.appRoot, "node_modules.asar.unpacked")))) {
            // vscode 12.1 or later
            rgPath = path.normalize(path.join(vscode.env.appRoot, "node_modules.asar.unpacked", "vscode-ripgrep", "bin", "rg"));
        } else if (fs.existsSync(path.normalize(path.join(vscode.env.appRoot, "node_modules")))) {
            // vscode 12.0
            rgPath = path.normalize(path.join(vscode.env.appRoot, "node_modules", "vscode-ripgrep", "bin", "rg"));
        }

        this.readConfig();

        console.log('memoGrepUseRipGrepConfigFilePath =', this.memoGrepUseRipGrepConfigFilePath);

        // Progress
        const progressOptions: vscode.ProgressOptions = {
            location: vscode.ProgressLocation.Window,
            title: 'Searching Memo...'
        };
        
        vscode.window.showInputBox({
            placeHolder: localize('grepEnterKeyword', 'Please enter a keyword or pattern'),
            prompt: localize('grepEnterKeyword', 'Please enter a keyword...'),
            ignoreFocusOut: true
        }).then(async (keyword) => {
            // console.log('name =', keyword);
            
            // ESC が押された、何も入力されずに Enter された場合はキャンセル
            if(keyword == undefined || keyword == "") { 
                return void 0;
            }

            this.memoGrepChannel.clear();

            vscode.window.withProgress(progressOptions, async (progress) => {
                progress.report({ message: localize('grepProgress', "Searching Memo...")});

                // console.log('memoGrepUseRipGrepConfigFile =', this.memoGrepUseRipGrepConfigFile);
                // console.log('memoGrepUseRipGrepConfigFilePath =', this.memoGrepUseRipGrepConfigFilePath);

                if (this.memoGrepUseRipGrepConfigFile) {
                    if (this.memoGrepUseRipGrepConfigFilePath == undefined) {
                        process.env.RIPGREP_CONFIG_PATH = path.normalize(path.join(os.homedir(), '.ripgreprc'));
                        // console.log('use', path.normalize(path.join(os.homedir(), '.ripgreprc')));
                    } else {
                        if (fs.existsSync(path.normalize(this.memoGrepUseRipGrepConfigFilePath))){
                            process.env.RIPGREP_CONFIG_PATH = path.normalize(this.memoGrepUseRipGrepConfigFilePath);
                        } else {
                            vscode.window.showErrorMessage(`${this.memoGrepUseRipGrepConfigFilePath}` + " No such file or directory");
                            return;
                        }
                    }
                    // console.log('memoGrep =', process.env.RIPGREP_CONFIG_PATH);
                    args = [];
                    result = cp.spawnSync(rgPath, args.concat([keyword]).concat([this.memodir]), {
                                    stdio: ['inherit'],
                                    cwd: this.memodir
                                });
                } else {
                    process.env.RIPGREP_CONFIG_PATH = ''; // unset
                    // console.log('memoGrep =', process.env.RIPGREP_CONFIG_PATH);
                    args = ['--vimgrep', '--color', 'never', '-g', '*.md', '-S'];
                    result = cp.spawnSync(rgPath, args.concat([keyword]).concat([this.memodir]), {
                                    stdio: ['inherit'],
                                    cwd: this.memodir
                                });
                }

                console.log(rgPath, args.concat([keyword]).concat([this.memodir]));
                console.log('result.status =', result.status);
                console.log('result.status =', result.stderr.toString());

                if (result.status == 0) {
                    list = result.stdout.toString().split('\n').sort(function(a,b) {
                        return (a < b ? 1 : -1);
                    });
                } else {
                    vscode.window.showErrorMessage(result.stderr.toString());
                    list = [];
                }
                console.log('list =', list);
            });

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
                    "label": localize('grepResultLabel', '{0} - $(location) Ln:{1} Col:{2}', index, line, col),
                    "description": `$(eye) ` + result,
                    "detail": `$(calendar) ` + path.basename(filename),
                    "ln": line,
                    "col": col,
                    "index": index,
                    "filename": filename,
                    "isDirectory": false,
                    "birthtime": null,
                    "mtime": null
                });

                this.memoGrepChannel.appendLine(`${index}: ` + 'file://' + filename + (process.platform == 'linux' ? ":" : "#") + line + ':' + col );
                this.memoGrepChannel.appendLine(result);
                this.memoGrepChannel.appendLine(vlist.replace(/^(.*?)(?=:)/gm, '').replace(/^:/g, 'Line ').toString());
                this.memoGrepChannel.appendLine('');
            });

                vscode.window.showQuickPick<items>(items, {
                    ignoreFocusOut: true,
                    matchOnDescription: true,
                    matchOnDetail: true,
                    placeHolder: localize('grepResult', 'grep Result: {0} ... (Number of results: {1})', keyword, items.length),
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
                            }).then(document => {
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
                }).then((selected) => {   // When selected with the mouse
                    if (selected == undefined || selected == null) {
                        grepLineDecoration.dispose();
                        grepKeywordDecoration.dispose();
                        vscode.commands.executeCommand('workbench.action.closeActiveEditor');
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
                    });
                    // ファイルを選択した後に、decoration を消す
                    grepLineDecoration.dispose();
                    grepKeywordDecoration.dispose();
                });
            });
    }

    dispose() {
        this._disposable.dispose();
    }
}
