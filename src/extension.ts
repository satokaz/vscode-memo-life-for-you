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
// import {MDDocumentContentProvider, isMarkdownFile, getMarkdownUri, showPreview} from './MDDocumentContentProvider'

const localize = nls.config(process.env.VSCODE_NLS_CONFIG)();

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscode-memo-life-for-you" is now active!');
    // console.log(vscode.env);

    // console.log(path.normalize(path.join(vscode.env.appRoot, "node_modules", "vscode-ripgrep", "bin", "rg")));
    // console.log('vscode.Markdown =', vscode.extensions.getExtension("Microsoft.vscode-markdown").extensionPath);

    let memo = new Memo();

    context.subscriptions.push(vscode.commands.registerCommand("extension.memoNew", () => memo.New()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoQuick", () => memo.QuickNew()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoEdit", () => memo.Edit()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoGrep", () => memo.Grep()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoConfig", () => memo.Config()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoServe", () => memo.Serve()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoReDate", () => memo.reDate()));
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
        memo.updateConfiguration();
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

/**
 * config.toml を作るための interface
 */
interface IMemoConfig {
    memodir: string;
	editor: string;
	column: number;
    selectcmd: string;
	grepcmd: string;
	assetsdir: string;
	pluginsdir: string;
    templatedirfile: string;
    templatebodyfile: string;
}

// vscode.QuickPickItem に ln, col を追加した items を interface で作成
interface items extends vscode.QuickPickItem {
    ln: string;
    col: string;
    index: number;
    filename: string;
}

class Memo {
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    private _waiting : boolean;
    private memoListChannel: vscode.OutputChannel;
    private memoGrepChannel: vscode.OutputChannel;
    private memopath: string;
    private memoaddr: string;
    public  memodir: string;
    private memoconfdir: string;
    private memoDateFormat: string;
    private memoISOWeek: boolean = false;
    private memoEmoji: boolean = false;
    private memoConfig = [];
    private memoGutterIconPath: string;
    private memoGutterIconSize: string;
    private memoWithRespectMode: boolean = false;
    private memoEditDispBtime: boolean = false;
    private memoGrepLineBackgroundColor: string;
    private memoGrepKeywordBackgroundColor: string;
    private memoEditPreviewMarkdown: boolean;
    private memoEditOpenMarkdown: boolean;

    public options: vscode.QuickPickOptions = {
        ignoreFocusOut: true,
        matchOnDescription: true,
        matchOnDetail: true,
        placeHolder: ''
    }

    public cp_options = {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024
    }

    constructor() {
        this.init(); // 初期化を同期にしたいので async/await で実行する
        this.memoListChannel = vscode.window.createOutputChannel("Memo List");
        this.memoGrepChannel = vscode.window.createOutputChannel("Memo Grep");
        this.updateConfiguration();
        this._waiting = false;

        fs.watchFile(path.normalize(path.join(this.memoconfdir, 'config.toml')), (curr, prev) => {
            // console.log(curr);
            this.updateConfiguration();
        });
    }

    async init(){
        await this.setMemoConfDir(); // 初回に memoconfdir が必要なので、createConfig で this.memoconfigdir に値を格納する
        // console.log("setMemoConfDir =", this.memoconfdir);
        await this.createConfig();
        await this.readConfig();
    }

    /**
     * New
     */
    public New() {
        this.readConfig();

        let file: string;
        let dateFormat = this.memoDateFormat;

        if(!this.memodir) {
            vscode.window.showErrorMessage(localize('memodirCheck', 'memodir is not set in config.toml'));
            return;
        }

        // memodir に設定されたディレクトりが実際に存在するかチェック
        try{
            fs.statSync(this.memodir);
        } catch(err) {
            // console.log(err);
            vscode.window.showErrorMessage(localize('memodirAccessCheck', 'The directory set in memodir does not exist'));
            return;
        }

        // 選択されているテキストを取得
        // エディタが一つも無い場合は、エラーになるので対処しておく
        let editor = vscode.window.activeTextEditor;
        let selectString: String = editor ? editor.document.getText(editor.selection) : "";

        vscode.window.showInputBox({
            placeHolder: localize('enterFileanme', 'Please Enter a Filename'),
            // prompt: "",
            value: `${selectString.substr(0,49)}`,
            ignoreFocusOut: true
        }).then(
            (title) => {
                if (title == undefined) { // キャンセル処理: ESC を押した時に undefined になる
                    return void 0;
                }

                let dateFormat: string = dateFns.format(new Date(), 'YYYY-MM-DD');

                if (title == "") {
                    file = dateFormat + ".md";
                } else {
                    file = dateFormat + '-' + title
                    .replace(/[\s\]\[\!\"\#\$\%\&\'\(\)\*\/\:\;\<\=\>\?\@\\\^\{\|\}\~\`]/g, '-')
                    .replace(/--+/g ,'') + ".md";
                }
                file = path.normalize(path.join(this.memodir, file));

                try {
                    // fs.accessSync(this.memodir);
                    fs.statSync(file);
                } catch(err) {
                    fs.writeFileSync(file, "# " + dateFormat + " " + `${title}` + "\n\n");
                }

                vscode.workspace.openTextDocument(file).then(document=>{
                        vscode.window.showTextDocument(document, {
                            viewColumn: 1,
                            preserveFocus: false, // focus を開いたエディタへ移行させるために false を設定
                            preview: true
                        }).then(document => {
                            // カーソルを目的の行に移動させて表示する為の処理
                            const editor = vscode.window.activeTextEditor;
                            const position = editor.selection.active;
                            var newPosition = position.with(editor.document.lineCount + 1 , 0);
                            // カーソルで選択 (ここでは、まだエディタ上で見えない)
                            editor.selection = new vscode.Selection(newPosition, newPosition);
                            // カーソル位置までスクロール
                            editor.revealRange(editor.selection, vscode.TextEditorRevealType.Default);
                        });
                });
            }
        );
    }

    /**
     * QuickNew
     */
    public QuickNew() {
        this.readConfig();

        let file: string;
        let date: Date = new Date();
        let dateFormat = this.memoDateFormat;
        let getISOWeek = this.memoISOWeek == true ? "[Week: " + dateFns.getISOWeek(new Date()) + "/" + dateFns.getISOWeeksInYear(new Date()) + "] " : "";
        let getEmoji = this.memoEmoji == true ? randomEmoji.random({count: 1})[0].character + " " : "";
        // console.log(getISOWeek);
        // console.log(getEmoji);

        file = path.normalize(path.join(this.memodir, dateFns.format(new Date(), 'YYYY-MM-DD') + ".md"));

        try {
            fs.statSync(file);
        } catch(err) {
            fs.writeFileSync(file, "# " + dateFns.format(new Date(), `${dateFormat}`) + "\n\n");
        }

        // 選択されているテキストを取得
        // エディタが一つも無い場合は、エラーになるので対処しておく
        let editor = vscode.window.activeTextEditor;
        let selectString: String = editor ? editor.document.getText(editor.selection) : "";

        vscode.workspace.openTextDocument(file).then(document => {
            vscode.window.showTextDocument(document, {
                viewColumn: 1,
                preserveFocus: false,
            }).then(document => {
                const editor = vscode.window.activeTextEditor;
                const position = editor.selection.active;
                var newPosition = position.with(editor.document.lineCount + 1 , 0);
                editor.selection = new vscode.Selection(newPosition, newPosition);
                    vscode.window.activeTextEditor.edit(function (edit) {
                        edit.insert(newPosition,
                            "\n" + "## "
                            + getISOWeek
                            + getEmoji
                            + dateFns.format(new Date(), `${dateFormat}`)
                            + " " + `${selectString.substr(0,49)}`
                            + "\n\n");
                    }).then(() => {
                        editor.revealRange(editor.selection, vscode.TextEditorRevealType.Default);
                    });
            });
        });
    }

    /**
     * Edit
     */
    public async Edit() {
        this.readConfig();
        let memopath = this.memopath;
        let memodir = this.memodir;
        let list: string[];
        let items: vscode.QuickPickItem[] = [];
        let openMarkdownPreview: boolean = this.memoEditOpenMarkdown;
        let listMarkdownPreview: boolean = this.memoEditPreviewMarkdown;
        let isEnabled: boolean = false; // Flag: opened Markdown Preview (Markdown Enhance Preview)
        // console.log("memodir = ", memodir)

        this.memoListChannel.clear();

        //
        // Markdown Preview Enhanced のチェック
        //
        if (listMarkdownPreview) {
            try {
                vscode.extensions.getExtension('shd101wyy.markdown-preview-enhanced').id;
            } catch (err) {
                listMarkdownPreview = false;
            }
        }

        try {
            list = fs.readdirSync(this.memodir, this.cp_options);
        } catch(err) {
            console.log(err);
        }

        // .md file のみで配列を作り直し
        list = list.filter(function(v, i) {
            return (path.extname(v) == ".md");
        });

        // 新しいものを先頭にするための sort
        list = list.sort(function(a,b) {
            return (a < b ? 1 : -1);
        });

        // console.log('list =', list);

        for (let index = 0; index < list.length; index++) {
            let v = list[index];

            if (list[index] == '') {
                break;
            }

            let filename = path.normalize(path.join(this.memodir, list[index]));

            let statBirthtime = this.memoEditDispBtime ? dateFns.format(fs.statSync(filename).birthtime, 'MMM DD HH:mm, YYYY ') : "";
            // console.log('birthtime =', statBirthtime);

            let array = fs.readFileSync(filename).toString().split("\n");

            items.push({
                "label": list[index],
                "description": array[0],
                "detail": this.memoEditDispBtime ? localize('editBirthTime', 'Create date: {0}', statBirthtime) : ""
             });

            this.memoListChannel.appendLine('file://' + path.normalize(path.join(this.memodir, list[index])) + `\t` + array[0]);
            this.memoListChannel.appendLine('');
        }
        // console.log("items =", items)

        // let previousFile = vscode.window.activeTextEditor.document.uri;
        await vscode.window.showQuickPick(items, {
            ignoreFocusOut: true,
            matchOnDescription: true,
            matchOnDetail: true,
            placeHolder: localize('enterSelectOrFilename', 'Please select or enter a filename...(All items: {0}) ...Todya\'s: {1}', items.length, dateFns.format(new Date(), 'MMM DD HH:mm, YYYY ')),
            onDidSelectItem: async (selected:vscode.QuickPickItem) => {
                if (selected == null) {
                    return void 0;
                }
                let filename = path.normalize(path.join(memodir, selected.label));

                // console.log(selected.label);
                // console.log(isEnabled);

                if (listMarkdownPreview) {
                    if (isEnabled) {
                        vscode.commands.executeCommand('workbench.action.focusPreviousGroup').then(async () =>{
                            // Markdown-enhance
                            await vscode.commands.executeCommand('markdown-preview-enhanced.syncPreview');
                            // Original
                            // await vscode.commands.executeCommand('markdown.refreshPreview');

                        });
                        isEnabled = false;
                    }
                }

                if (listMarkdownPreview) {
                    // 選択時に markdown preview を開く場合。要 Markdown Preview Enhance 拡張機能
                    await vscode.workspace.openTextDocument(filename).then(async document=>{
                        await vscode.window.showTextDocument(document, {
                            viewColumn: 1,
                            preserveFocus: true,
                            preview: true
                        })
                    }).then(async () => {
                        await vscode.commands.executeCommand('markdown-preview-enhanced.openPreview').then(async () => {
                            // markdown preview を open すること focus が移動するので、focus を quickopen に戻す作業 1 回目
                            await vscode.commands.executeCommand('workbench.action.focusQuickOpen');
                        });
                        // さらにもう一度実行して focus を維持する (なんでだろ? bug?)
                        await vscode.commands.executeCommand('workbench.action.focusQuickOpen');
                    });
                    // もう一回! (bug?)
                    await vscode.commands.executeCommand('workbench.action.focusQuickOpen');
                    isEnabled = true;
                } else {
                    // 選択時に markdown preview を開かない設定の場合
                    vscode.workspace.openTextDocument(filename).then(async document=>{
                        vscode.window.showTextDocument(document, {
                            viewColumn: 1,
                            preserveFocus: true,
                            preview: true
                        })
                    })
                }
            }
        }).then(async function (selected) {   // When selected with the mouse
            if (selected == null) {
                if (listMarkdownPreview) {
                    //キャンセルした時の close 処理
                    await vscode.commands.executeCommand('workbench.action.closeActiveEditor').then(() => {
                            vscode.commands.executeCommand('workbench.action.focusPreviousGroup').then(() => {
                                    // vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                            });
                    });
                }

                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                return void 0;
            }
            await vscode.workspace.openTextDocument(path.normalize(path.join(memodir, selected.label))).then(async document => {
                    await vscode.window.showTextDocument(document, {
                        viewColumn: 1,
                        preserveFocus: true,
                        preview: true
                    }).then(async editor => {
                        if (listMarkdownPreview) {
                            if (openMarkdownPreview) {
                            // vscode.window.showTextDocument(document, vscode.ViewColumn.One, false).then(editor => {
                                // Markdown-Enhance
                                // await vscode.commands.executeCommand('markdown.showPreviewToSide').then(() =>{
                                await vscode.commands.executeCommand('markdown-preview-enhanced.openPreview').then(() =>{
                                    vscode.commands.executeCommand('workbench.action.focusPreviousGroup');
                                });
                            // });
                            } else {
                                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                            }
                        } else if (openMarkdownPreview) {
                            await vscode.commands.executeCommand('markdown.showPreviewToSide').then(() => {
                                vscode.commands.executeCommand('workbench.action.focusPreviousGroup');
                            });
                        }
                    });
            });
        });
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
        const rgPath: string = path.normalize(path.join(vscode.env.appRoot, "node_modules", "vscode-ripgrep", "bin", "rg"));

        this.readConfig();

        vscode.window.showInputBox({
            placeHolder: localize('grepEnterKeyword', 'Please enter a keyword'),
            // prompt: "",
            ignoreFocusOut: true
        }).then((keyword) => {
                if(keyword == undefined || "") {
                    return void 0;
                }
                this.memoGrepChannel.clear();

                keyword = keyword.replace(/\s/g, '\ ');
                // console.log('name =', keyword);

                vscode.window.withProgress({
                        location: vscode.ProgressLocation.Window,
                        title: 'Searching Memo...'
                    }, progress => {
                        return new Promise((resolve, reject) => {
                            progress.report({ message: localize('grepProgress', "Searching Memo...")});
                // console.time("test");
                try {
                        list = cp.spawnSync(rgPath, ['--vimgrep', '--color', 'never', '-g', '*.md', '-S', `${keyword}`, `${this.memodir}`], {
                        stdio: ['inherit']
                                }).stdout.toString().split('\n');
                                // resolve (list);
                } catch(err) {
                                // console.log(err);
                                vscode.window.showErrorMessage(localize('grepNoResult', 'There is no result.'));
                                reject (err);
                            } finally {
                                // statusBarItem.dispose();
                                resolve ();
                            }
                            console.timeEnd("test");
                        });
                }
                );

                // console.time("test2");
                list.forEach((vlist, index) => {
                    if (vlist == '') {
                        return;
                    }
                    // console.log(vlist);

                    let filename: string = vlist.match((process.platform == "win32") ? /^(.*?)(?=:).(.*?)(?=:)/gm : /^(.*?)(?=:)/gm).toString();;
                    // console.log("filename =", filename);

                    let line: string = vlist.replace((process.platform == "win32") ? /^(.*?)(?=:).(.*?)(?=:)/gm : /^(.*?)(?=:)/gm, "")
                    .replace(/^:/gm, "").match(/^(.*?)(?=:)/gm).toString();
                    // console.log("line =", line);

                    let col: string = vlist.replace((process.platform == "win32") ? /^(.*?)(?=:).(.*?)(?=:)/gm : /^(.*?)(?=:)/gm, "")
                    .replace(/^:/gm, "").replace(/^(.*?)(?=:)/gm, "").replace(/^:/gm, "").match(/^(.*?)(?=:)/gm).toString();;
                    // console.log("col =", col);

                    let result = vlist.replace((process.platform == "win32") ? /^(.*?)(?=:).(.*?)(?=:).(.*?)(?=:).(.*?)(?=:):/gm : /^(.*?)(?=:).(.*?)(?=:).(.*?)(?=:):/gm, "").toString();
                    // console.log("result =", result);

                    items.push({
                        "label": localize('grepResultLabel', '{0} - Ln:{1} Col:{2}', index, line, col),
                        "description": result,
                        "detail": path.basename(filename),
                        "ln": line,
                        "col": col,
                        "index": index,
                        "filename": filename
                    });

                    this.memoGrepChannel.appendLine(`${index}: ` + 'file://' + filename + (process.platform == 'linux' ? ":" : "#") + result);
                    this.memoGrepChannel.appendLine(vlist.replace(/^(.*?)(?=:)/gm, '').replace(/^:/g, 'Line ').toString());
                    this.memoGrepChannel.appendLine('');
                });
                // console.timeEnd("test2");

                vscode.window.showQuickPick<items>(items, {
                    ignoreFocusOut: true,
                    matchOnDescription: true,
                    matchOnDetail: true,
                    placeHolder: localize('grepResult', 'grep Result: {0} ... (Number of results: {1})', keyword, items.length),
                    onDidSelectItem: async (selected: items) => {
                        if (selected == null || "") {
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
                                // var newPosition = position.with(Number(selected.label.split(':')[0]) - 1 , 0);
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
                    if (selected == undefined || null) {
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

    /**
     * Config
     */
    public Config() {
        vscode.workspace.openTextDocument(path.normalize(path.join(this.memoconfdir, 'config.toml'))).then(document=>{
            vscode.window.showTextDocument(document, {
                viewColumn: 1,
                preserveFocus: true,
                preview: false
            });
        });
    }

    /**
     * Serve
     */
    public Serve() {
        // memopath に設定されたコマンドが実行可能かチェック
        try{
            cp.execSync(this.memopath);
        } catch(err) {
            // console.log(err);
            vscode.window.showErrorMessage(localize('serveCheck', 'memo command can not be executed'));
            return;
        }
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

    /**
     * reDate
     */
    public reDate() {
        interface MemoMessageItem extends vscode.MessageItem {
            id: number;
        }

        // modal dialog
        let modal_options = {
            modal: true
        }
        let modal_items = {
            title: localize('close', 'Close'),
            isCloseAffordance: true
        }

        if (!vscode.window.activeTextEditor) {
            vscode.window.showErrorMessage(localize('reDateNotActiveEditor', 'Not an active editor.'));
            return;
        }

        let activeFilename = vscode.Uri.file(vscode.window.activeTextEditor.document.fileName);
        // console.log(activeFilename.fsPath);

        // vscode.Uri.fsPath は lowercase で、Node.js は Upercase でドライブ名を返してくるので、lowercase に変換して比較する
        if ((process.platform == "win32" ? path.dirname(activeFilename.fsPath).toLowerCase() : path.dirname(activeFilename.fsPath)) !== (process.platform == "win32" ? path.normalize(this.memodir).toLowerCase() : path.normalize(this.memodir))) {
            vscode.window.showInformationMessage(localize('reDateNotMemodir', "There are no files in memodir to apply changes"), modal_options, modal_items);
            return;
        }

        vscode.window.showInformationMessage<MemoMessageItem>(localize('reDateUpdateFilename', 'Would you like to update the file name of {0} to the latest date?', activeFilename.fsPath), { modal: true },
            {
                title: localize('yes', 'Yes'),
                id: 1,
            },
            {
                title: localize('no', "No"),
                id: 2,
                isCloseAffordance: true
            }
        ).then(async (selected) => {
            if (!selected || selected.id === 2) {
                return;
            }
            switch (selected.id) {
                case 1:
                    // console.log(path.basename(activeFilename.fsPath).match(/^\d{4}-\d{1,2}-\d{1,2}-/gm));

                    let tempfilename = path.basename(activeFilename.fsPath).replace(/^\d{4}-\d{1,2}-\d{1,2}/gm, '');
                    // console.log('tempfilename =', tempfilename);

                    if(!path.basename(activeFilename.fsPath).match(/^\d{4}-\d{1,2}-\d{1,2}-/gm) || tempfilename == ".md"){
                        vscode.window.showInformationMessage(localize('reDateNotUpdateFilename', "Since the file name is only date, it will not be updated. Only the file name of 'YY-MM-DD -xxxx.md' format can be changed."), modal_options, modal_items);
                        return;
                    }

                    let newFilePath = path.join(path.dirname(activeFilename.fsPath), dateFns.format(new Date(), 'YYYY-MM-DD') + tempfilename);

                    // file 名を新しい日付に書き換える
                    if (activeFilename.fsPath == newFilePath) {
                        vscode.window.showInformationMessage(localize('reDateSameDate', "Can not be changed to the same date"), modal_options, modal_items);
                        return;
                    }

                    fse.copySync(activeFilename.fsPath, path.join(path.dirname(activeFilename.fsPath), dateFns.format(new Date(), 'YYYY-MM-DD') + tempfilename));

                    vscode.commands.executeCommand('workbench.action.closeActiveEditor').then(() => {
                        vscode.workspace.openTextDocument(newFilePath).then(document=>{
                            vscode.window.showTextDocument(document, {
                                viewColumn: 1,
                                preserveFocus: false,
                                preview: true
                            });
                        });
                    });

                    let newFilename = path.join(path.dirname(activeFilename.fsPath), dateFns.format(new Date(), 'YYYY-MM-DD') + tempfilename);
                    fs.unlinkSync(activeFilename.fsPath);

                    vscode.window.showInformationMessage(localize('reDateUpdateToda', 'Updated file name to today\'s date: {0}', newFilename), { modal: true },
                    {
                        title: localize('close', 'Close'),
                        isCloseAffordance: true
                    });
                break;
            }
        });
    }

    /**
     * setMemoConfDir
     */
    public setMemoConfDir() {
        if (process.platform == "win32") {
            this.memoconfdir = process.env.APPDATA;
            if (this.memoconfdir == "") {
                this.memoconfdir = path.normalize(path.join(process.env.USERPROFILE, "Application Data", "memo"));
            }
            this.memoconfdir = path.normalize(path.join(this.memoconfdir, "memo"));
        } else {
            this.memoconfdir = path.normalize(path.join(process.env.HOME, ".config", "memo"));
        }
        return void 0;
    }

    /**
     * createConfig
     */
    public createConfig() {
        fse.pathExists(this.memoconfdir, (err, exists) => {
            if (!exists) {
                // memo ディレクトリが存在しているか確認しなければ、memo dir, _posts dir と plugins dir を作成
                fse.mkdirpSync(this.memoconfdir, {mode: 0o700});
                fse.mkdirpSync(path.normalize(path.join(this.memoconfdir, '_posts')), {mode: 0o700});
                fse.mkdirpSync(path.normalize(path.join(this.memoconfdir, 'plugins')), {mode: 0o700});
                fs.writeFileSync(path.normalize(path.join(this.memoconfdir, 'config.toml')), this.cfgtoml(this.memoconfdir), {mode: 0o600});
                vscode.window.showInformationMessage(localize('createConfig', 'vscode memo life for you: {0} directory created', this.memoconfdir));
            } else {
                // config.toml が存在しているかチェック
                fse.pathExists(path.normalize(path.join(this.memoconfdir, "config.toml")), (err, exists) => {
                    if (!exists) {
                        fs.writeFileSync(path.normalize(path.join(this.memoconfdir, 'config.toml')), this.cfgtoml(this.memoconfdir));
                        vscode.window.showInformationMessage(localize('createConfigFile', "vscode memo life for you: {0} created", path.normalize(path.join(this.memoconfdir, "config.toml"))));
                    }
                });
            }
        });
        return;
    }

    /**
     * readConfig
     */
    public readConfig() {
        let editor;
        let memodir;
        let list = fs.readFileSync(path.normalize(path.join(this.memoconfdir, "config.toml"))).toString().split("\n");

        // console.log('readConfig =', list);
        list.forEach(async function (v, i) {
            // console.log(v.split("=")[1]);
            if (v.match(/^memodir =/)) {
                memodir = v.split("=")[1].replace(/"/g, "").trim();
            }
            if (v.match(/^editor =/)) {
                editor = v.split("=")[1].replace(/"/g, "").trim();
            }
        });

        this.memodir = memodir;
        return void 0;
    }

    /**
     * cfgtoml
     * @param confDir
     */
    public cfgtoml(confDir) {
        let config: IMemoConfig = {
            memodir: process.env.MEMODIR == undefined ? path.normalize(path.join(confDir, "_posts")) : process.env.MEMODIR,
            editor: process.env.EDITOR == undefined ? "code" : process.env.EDITOR,
            column: 20,
            selectcmd: "peco",
            grepcmd: (process.platform == "win32") ? "grep -nH ${PATTERN} ${FILES}" : path.normalize(path.join(vscode.env.appRoot, "node_modules", "vscode-ripgrep", "bin", "rg").replace(/\s/g, '\\ ')) + ' -n --no-heading -S ${PATTERN} ${FILES}',
            assetsdir: "",
            pluginsdir: path.normalize(path.join(confDir, "plugins")),
            templatedirfile: "",
            templatebodyfile: "",
        }

        return tomlify(config, function (key, value) {
            let context = this;
            let path = tomlify.toKey(context.path);
            if (/^column/.test(path)) {
                return Math.floor(value).toString();
            }
            return false;
        }, '  ');
    }

    /**
     * rgPath
     */
    public rgPath() {
        return path.normalize(path.join(vscode.env.appRoot, "node_modules", "vscode-ripgrep", "bin", "rg"));
    }

    /**
     * updateConfiguration
     */
    public updateConfiguration() {
        this.memopath = path.normalize(vscode.workspace.getConfiguration('memo-life-for-you').get<string>('memoPath'));
        this.memoaddr = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('serve-addr');
        this.memoDateFormat = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('dateFormat');
        this.memoISOWeek = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('insertISOWeek');
        this.memoEmoji = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('insertEmoji');
        this.memoGutterIconPath = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('gutterIconPath');
        this.memoGutterIconSize = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('gutterIconSize');
        this.memoWithRespectMode = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('withRespectMode');
        this.memoEditDispBtime = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('displayFileBirthTime');
        this.memoGrepLineBackgroundColor = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('grepLineBackgroundColor');
        this.memoGrepKeywordBackgroundColor = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('grepKeywordBackgroundColor');
        this.memoEditPreviewMarkdown = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('listMarkdownPreview');
        this.memoEditOpenMarkdown = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('openMarkdownPreview');
    }

    get onDidChange() {
        return this._onDidChange.event;
    }

    update(uri) {
        if (!this._waiting) {
            this._waiting = true;
            setTimeout(() => {
                this._waiting = false;
                this._onDidChange.fire(uri);
            }, 300);
        }
    }
}
