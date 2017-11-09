'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as randomEmoji from 'random-emoji';
import * as dateFns from 'date-fns';
import * as tomlify from 'tomlify-j0.4';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscode-memo-life-for-you" is now active!');
    // console.log(vscode.env);

    // console.log(path.normalize(path.join(vscode.env.appRoot, "node_modules", "vscode-ripgrep", "bin", "rg")));

    let memo = new Memo();

    context.subscriptions.push(vscode.commands.registerCommand("extension.memoNew", () => memo.New()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.memoQuick", () => memo.QuickNew()));
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
}

class Memo {
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
    private memoEditDispBtime: boolean = false;

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

        // 選択されているテキストを取得
        // エディタが一つも無い場合は、エラーになるので対処しておく
        let editor = vscode.window.activeTextEditor;
        let selectString: String = editor ? editor.document.getText(editor.selection) : "";
    
        vscode.window.showInputBox({
            placeHolder: 'Please Enter a Filename',
            // prompt: "",
            value: `${selectString.substr(0,49)}`,
            ignoreFocusOut: true
        }).then(
            (title) => {
                if (title == undefined) {
                    return void 0;
                }

                if (title == "") {
                    // file = dateFormat + ".md";
                    file = dateFns.format(new Date(), 'YYYY-MM-DD') + ".md";
                } else {
                    file = dateFns.format(new Date(), 'YYYY-MM-DD') + '-' + title
                    .replace(/[\s\]\[\!\"\#\$\%\&\'\(\)\*\/\:\;\<\=\>\?\@\\\^\{\|\}\~\`]/g, '-')
                    .replace(/--+/g ,'') + ".md";
                }
                file = path.normalize(path.join(this.memodir, file));

                try {
                    fs.statSync(file);
                } catch(err) {
                    fs.writeFileSync(file, "# " + dateFns.format(new Date(), 'YYYY-MM-DD') + " " + `${title}` + "\n\n");
                }

                vscode.workspace.openTextDocument(file).then(document=>{
                        vscode.window.showTextDocument(document, {
                            viewColumn: 1,
                            preserveFocus: false,
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
        
        file = dateFns.format(new Date(), 'YYYY-MM-DD') + ".md";
        file = path.normalize(path.join(this.memodir, file));

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
                    });
                editor.revealRange(editor.selection, vscode.TextEditorRevealType.Default);
            });
        });
    }

    /**
     * Edit
     */
    public Edit() {
        this.readConfig(); 
        let memopath = this.memopath;
        let memodir = this.memodir;
        let list: string[];
        // console.log("memodir = ", memodir)

        this.memoListChannel.clear();
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
        let items: vscode.QuickPickItem[] = [];

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
                "detail": statBirthtime });

            this.memoListChannel.appendLine('file://' + path.normalize(path.join(this.memodir, list[index])) + `\t` + array[0]);
            this.memoListChannel.appendLine('');
        }
        // console.log("items =", items)

        // let previousFile = vscode.window.activeTextEditor.document.uri;

        vscode.window.showQuickPick(items, {
            ignoreFocusOut: true,
            matchOnDescription: true,
            matchOnDetail: true,
            placeHolder: 'Please select or enter a filename...' + `(All items: ${items.length})`,
            onDidSelectItem: async (selected:vscode.QuickPickItem) => {
                if (selected == null) {
                    return void 0;
                }
                // console.log(selected.label);
                let filename = path.normalize(path.join(memodir, selected.label));
                vscode.workspace.openTextDocument(filename).then(document=>{
                    vscode.window.showTextDocument(document, {
                        viewColumn: 1,
                        preserveFocus: true,
                        preview: true
                    });
                });
            }
        }).then(function (selected) {   // When selected with the mouse
            if (selected == null) {
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                return void 0;
            }
            vscode.workspace.openTextDocument(path.normalize(path.join(memodir, selected.label))).then(document => {
                    vscode.window.showTextDocument(document, {
                        viewColumn: 1,
                        preserveFocus: true,
                        preview: true
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
        let grepDecoration: vscode.TextEditorDecorationType;
        
        this.readConfig(); 
        
        let list: string[];

        vscode.window.showInputBox({
            placeHolder: 'Please enter a keyword',
            // prompt: "",
            ignoreFocusOut: true
        }).then(
            (keyword) => {
                if(keyword == undefined || "") {
                    return void 0;
                }
                this.memoGrepChannel.clear();

                keyword = keyword.replace(/\s/g, '\ ');
                // console.log('name =', keyword);

                try {
                    // list = cp.execSync(`${this.memopath} grep ${keyword}`, this.cp_options).toString().split('\n');

                    const rgPath: string = path.normalize(path.join(vscode.env.appRoot, "node_modules", "vscode-ripgrep", "bin", "rg"));

                    // rg は tty で実行された時だけ行番号を出力するオプションがデフォルトで設定される
                    list = cp.execFileSync(rgPath, ['--vimgrep', '--color', 'never', '-g', '*.md', '-S', `${keyword}`, `${this.memodir}`], {
                        maxBuffer: 1024 * 1024,
                        stdio: ['inherit']
                    }).toString().split('\n');
                } catch(err) {
                    // console.log(err);
                    vscode.window.showErrorMessage("There is no result.");
                    return void 0;
                }

                // console.log('list =', list);
                
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
                        "label": 'Ln: ' + line + ", Col: " + col + " " + result,
                        "description": "",
                        "detail": filename,
                        "ln": line,
                        "col": col,
                        "index": index
                    });

                    this.memoGrepChannel.appendLine(`${index}: ` + 'file://' + filename + (process.platform == 'linux' ? ":" : "#") + result);
                    this.memoGrepChannel.appendLine(vlist.replace(/^(.*?)(?=:)/gm, '').replace(/^:/g, 'Line ').toString());
                    this.memoGrepChannel.appendLine('');
                });
                
                vscode.window.showQuickPick(items, {
                    ignoreFocusOut: true,
                    matchOnDescription: true,
                    matchOnDetail: true,
                    placeHolder: 'grep Result: ' + `${keyword} ... (Number of results: ${items.length})`,
                    onDidSelectItem: async (selected: items) => {
                        if (selected == null || "") {
                            return void 0;
                        }
                        // console.log('selected.label =', selected.label);
                        // console.log('selected =', selected)

                        vscode.workspace.openTextDocument(selected.detail).then(document => {
                            vscode.window.showTextDocument(document, {
                                viewColumn: 1,
                                preserveFocus: true,
                                preview: true
                            }).then(async document => {
                                // カーソルを目的の行に移動させて表示する為の処理
                                const editor = vscode.window.activeTextEditor;
                                const position = editor.selection.active;
                                // var newPosition = position.with(Number(selected.label.split(':')[0]) - 1 , 0);
                                const newPosition = position.with(Number(selected.ln) - 1 , Number(selected.col) -1);
                                // カーソルで選択 (ここでは、まだエディタ上で見えない)
                                editor.selection = new vscode.Selection(newPosition, newPosition);

                                // highlight decoration
                                if (grepDecoration) {
                                    grepDecoration.dispose();
                                }
                                let startPosition = new vscode.Position(Number(selected.ln) - 1 , 0);
                                let endPosition = new vscode.Position(Number(selected.ln), 0);
                                grepDecoration = vscode.window.createTextEditorDecorationType( <vscode.DecorationRenderOptions> {
                                    isWholeLine: true,
                                    // outline: 'solid',
                                    // outlineWidth: '1px',
                                    // outlineColor: "invert",
                                    // outlineStyle: "",
                                    border: 'solid',
                                    borderWidth: '1px',
                                    // borderStyle: 'outset',
                                    borderColor: 'rgba(244, 155, 66, 0.8)',
                                    gutterIconPath: path.join(__filename, '..', '..', '..', 'resources', 'sun.svg'),
                                    gutterIconSize: '90%',
                                    backgroundColor: "rgba(244, 155, 66, 0.5)"
                                }); 
                                editor.setDecorations(grepDecoration, [new vscode.Range(startPosition, startPosition)]);

                                // カーソル位置までスクロール
                                editor.revealRange(editor.selection, vscode.TextEditorRevealType.Default);
                            });
                        });
                    }
                }).then((selected) => {   // When selected with the mouse
                    if (selected == undefined || null) {
                        grepDecoration.dispose();
                        vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                        return void 0;
                    }
                    vscode.workspace.openTextDocument(selected.detail).then(document => {
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
                    grepDecoration.dispose();
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
                vscode.window.showInformationMessage("vscode memo life for you: " + `${this.memoconfdir}` + " directory created");;
            } else {
                // config.toml が存在しているかチェック
                fse.pathExists(path.normalize(path.join(this.memoconfdir, "config.toml")), (err, exists) => {
                    if (!exists) {
                        fs.writeFileSync(path.normalize(path.join(this.memoconfdir, 'config.toml')), this.cfgtoml(this.memoconfdir));
                        vscode.window.showInformationMessage("vscode memo life for you: " + `${path.normalize(path.join(this.memoconfdir, "config.toml"))}` + " created");
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
        this.memoEditDispBtime = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('displayFileBirthTime');
    }
}
