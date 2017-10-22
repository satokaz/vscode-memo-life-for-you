'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as randomEmoji from 'random-emoji';
import * as dateFns from 'date-fns';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscode-memo-life-for-you" is now active!');

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
    private memoconfdir: string;
    private memoDateFormat: string;
    private memoISOWeek: boolean;
    private memoEmoji: boolean;
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

    // memo new
    public New() {
        let file: string;
        let dateFormat = this.memoDateFormat;

        vscode.window.showInputBox({
            placeHolder: 'Please Enter a Filename',
            // prompt: "",
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
                        // console.log('uri =', document.uri.toString()); // uri = file:///Users/satokaz/.config/memo/2017-10-15.md
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
                                    // vscode.window.activeTextEditor.edit(function (edit) {
                                    //     edit.insert(newPosition, "## " + date + "\n");
                                    // });
                                // カーソル位置までスクロール
                                editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenter);
                            });
                    });
                    // }
                }
            );
    }

    //
    public QuickNew() {
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

        vscode.workspace.openTextDocument(file).then(document=>{
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
                            + "\n\n");
                    });
                editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenter);
            });
        });
    }

    // memo edit
    public Edit() {
        let memopath = this.memopath;
        let memodir = this.memodir;
        let list: string[];
        // console.log("memodir = ", memodir)

        this.memoListChannel.clear();

        try {
            list = cp.execSync(`${this.memopath} list`, this.cp_options).toString().split('\n');
        } catch(err) {

        }

        // console.log('list =', list);
        let items: vscode.QuickPickItem[] = [];
        // let items = [];

        // let items;

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
        // this.memoListChannel.show();

        // console.log("items =", items)

        // let previousFile = vscode.window.activeTextEditor.document.uri;

        // New
        vscode.window.showQuickPick(items, {
            ignoreFocusOut: true,
            matchOnDescription: true,
            matchOnDetail: true,
            placeHolder: 'Please select or enter a filename...',
            onDidSelectItem: async (selected:vscode.QuickPickItem) => {
                if (selected == null) {
                    return void 0;
                }
                // console.log(selected.label);
                vscode.workspace.openTextDocument(path.normalize(path.join(memodir, selected.label))).then(document=>{
                    vscode.window.showTextDocument(document, {
                        viewColumn: 1,
                        preserveFocus: true,
                        preview: true
                    });
                });
            }
        }).then(function (selected) {   // When selected with the mouse
            if (selected == null) {
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

    // memo grep
    public Grep() {
        let items: vscode.QuickPickItem[] = [];
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
                    list = cp.execSync(`${this.memopath} grep ${keyword}`, this.cp_options).toString().split('\n');
                } catch(err) {
                    vscode.window.showErrorMessage("memo: pattern required");
                    return void 0;
                }
                // console.log(list);
                for (let index = 0; index < list.length; index++) {
                    if (list[index] == '') {
                        break;
                    }

                    let vsplit = list[index].split(":", 2);
                    // let vdetail = (list[index].match(/^(.*?)(?=:)/gm)).toString();

                    items.push({
                        "label": list[index].replace(/^(.*?)(?=:)/gm, '').toString(),
                        "description": "",
                        "detail": vsplit[0]
                    });
                    // console.log(items[i]);

                    this.memoGrepChannel.appendLine(`${index}: ` + 'file://' + vsplit[0] + (process.platform == 'linux' ? ":" : "#") + vsplit[1]);
                    this.memoGrepChannel.appendLine(list[index].replace(/^(.*?)(?=:)/gm, '').replace(/^:/g, 'Line ').toString());
                    this.memoGrepChannel.appendLine('');
                }
                // this.memoGrepChannel.show();

                vscode.window.showQuickPick(items, {
                    ignoreFocusOut: true,
                    matchOnDescription: true,
                    matchOnDetail: true,
                    placeHolder: 'grep Result: ' + `${keyword}`,
                    onDidSelectItem: async (selected:vscode.QuickPickItem) => {
                        if (selected == null || "") {
                            return void 0;
                        }
                        // console.log(selected.label);

                        vscode.workspace.openTextDocument(selected.detail).then(document => {
                            vscode.window.showTextDocument(document, {
                                viewColumn: 1,
                                preserveFocus: true,
                                preview: true
                            }).then(document => {
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
                    }
                }).then(function (selected) {   // When selected with the mouse
                    if (selected == null) {
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
        if (process.platform == "win32") {
            this.memoconfdir = process.env.APPDATA;
            if (this.memoconfdir == "") {
                this.memoconfdir = path.join(process.env.USERPROFILE, "Application Data", "memo");
            }
            this.memoconfdir = path.join(this.memoconfdir, "memo");
        } else {
            this.memoconfdir = path.join(process.env.HOME, ".config", "memo");
        }
        // console.log("memoconfdir =", path.normalize(path.join(this.memoconfdir, 'config.toml')));

        vscode.workspace.openTextDocument(path.normalize(path.join(this.memoconfdir, 'config.toml'))).then(document=>{
            vscode.window.showTextDocument(document, {
                viewColumn: 1,
                preserveFocus: true,
                preview: false
            });
        });
    }

    public readConfig() {
        let editor;
        let memodir;
        let list = cp.execSync(`${this.memopath} config --cat`, this.cp_options).toString().split('\n');

        list.forEach(async function (v, i) {
            // console.log(v.split("=")[1]);
            if (v.match(/^memodir =/)) {
                memodir = v.split("=")[1].replace(/"/g, "").trim();
            }
            if (v.match(/^editor =/)) {
                editor = v.split("=")[1].replace(/"/g, "").trim();
                // console.log("editor =", editor);
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
        this.memoDateFormat = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('dateFormat');
        this.memoISOWeek = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('insertISOWeek');
        this.memoEmoji = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('insertEmoji');
    }
}
