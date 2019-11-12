'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as randomEmoji from 'node-emoji';
import * as dateFns from 'date-fns';
import * as nls from 'vscode-nls';
import * as os from 'os';
import { items, memoConfigure } from './memoConfigure';
import * as clipboardy from 'clipboardy';
import * as Mustache from 'mustache';

const localize = nls.config(process.env.VSCODE_NLS_CONFIG)();

export class memoNew extends memoConfigure  {

    constructor() {
        super();
    }

    /**
     * New
     */
    public New() {
        this.readConfig();

        let file: string;

        let selectString: string = "";
        // エディタが一つも無い場合は、エラーになるので対処しておく
        let editor = vscode.window.activeTextEditor;

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

        // vscode 上選択されているテキストを取得
        if (this.memoNewFilenameFromSelection == true) {
            selectString = editor.document.getText(editor.selection);
        }

        // vscde 上で何も選択されていない (= 0) 場合は、clipboard を参照する
        if (this.memoNewFilenameFromClipboard == true) {
            if (selectString.length == 0) {
                selectString = clipboardy.readSync();
            }
        }
        // console.log('selectString =', selectString);

        let fileNameDateFormat: string = dateFns.format(new Date(), 'YYYY-MM-DD');
        let filNameDateSuffix: string = "";

        if (this.memoNewFilNameDateSuffix !== "") {
            filNameDateSuffix  = dateFns.format(new Date(), this.memoNewFilNameDateSuffix);
            
        }

        vscode.window.showInputBox({
            placeHolder: localize('enterFilename', 'Please Enter a Filename (default: {0}.md)', fileNameDateFormat + filNameDateSuffix),
            // prompt: "",
            value: `${selectString.substr(0,49)}`,
            ignoreFocusOut: true
        }).then(
            (title) => {
                if (title == undefined) { // キャンセル処理: ESC を押した時に undefined になる
                    return void 0;
                }

                if (title == "") {
                    file = fileNameDateFormat + filNameDateSuffix + ".md";
                } else {
                    file = fileNameDateFormat + filNameDateSuffix + "-" + title
                    .replace(/[\s\]\[\!\"\#\$\%\&\'\(\)\*\/\:\;\<\=\>\?\@\\\^\{\|\}\~\`]/g, '-')
                    .replace(/--+/g ,'') + ".md";
                }
                file = path.normalize(path.join(this.memodir, file));

                try {
                    // fs.accessSync(this.memodir);
                    fs.statSync(file);
                } catch(err) {
                    const content = this.memoTemplate(title, fileNameDateFormat);
                    fs.writeFileSync(file, content);
                }

                if (this.memoEditOpenNewInstance){
                    vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(path.dirname(file)), true).then(() => {
                        vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(file));
                    });
                } else {
                    vscode.workspace.openTextDocument(file).then(document=>{
                            vscode.window.showTextDocument(document, {
                                viewColumn: 1,
                                preserveFocus: false, // focus を開いたエディタへ移行させるために false を設定
                                preview: true
                            }).then(document => {
                                // カーソルを目的の行に移動させて表示する為の処理
                                const editor = vscode.window.activeTextEditor;
                                const position = editor.selection.active;
                                const newPosition = position.with(editor.document.lineCount + 1 , 0);
                                // カーソルで選択 (ここでは、まだエディタ上で見えない)
                                editor.selection = new vscode.Selection(newPosition, newPosition);
                                // カーソル位置までスクロール
                                editor.revealRange(editor.selection, vscode.TextEditorRevealType.Default);
                            });
                    });
                }
            }
        );
    }

    /**
     * QuickNew
     */
    public QuickNew() {
        this.readConfig();

        let file: string = path.normalize(path.join(this.memodir, dateFns.format(new Date(), 'YYYY-MM-DD') + ".md"));
        let date: Date = new Date();
        let dateFormat = this.memoDateFormat;
        let getISOWeek = this.memoISOWeek == true ? "[Week: " + dateFns.getISOWeek(new Date()) + "/" + dateFns.getISOWeeksInYear(new Date()) + "] " : "";
        let getEmoji = this.memoEmoji == true ? randomEmoji.random().emoji : "";

        // console.log(getISOWeek);
        // console.log(getEmoji);

        fs.stat(file, async (err, files) => {
            if (err) {
                await fs.writeFile(file, "# " + dateFns.format(new Date(), `${dateFormat}`) + os.EOL + os.EOL, (err) => {
                    if (err) throw err;
                });
            }
        });

        // 選択されているテキストを取得
        // エディタが一つも無い場合は、エラーになるので対処しておく
        let editor = vscode.window.activeTextEditor;
        let selectString: String = editor ? editor.document.getText(editor.selection) : "";    

        if (this.memoEditOpenNewInstance) {
            vscode.workspace.openTextDocument(file).then(document => {
                vscode.window.showTextDocument(document, {
                    viewColumn: -1,
                    preserveFocus: false,
                }).then(async document => {
                    const editor = vscode.window.activeTextEditor;
                    const position = editor.selection.active;
                    const newPosition = position.with(editor.document.lineCount + 1 , 0);
                    editor.selection = new vscode.Selection(newPosition, newPosition);
                        vscode.window.activeTextEditor.edit(async function (edit) {
                            edit.insert(newPosition,
                                os.EOL + "## "
                                + getISOWeek
                                + getEmoji
                                + dateFns.format(new Date(), `${dateFormat}`)
                                + " " + `${selectString.substr(0,49)}`
                                + os.EOL + os.EOL);
                        }).then(() => {
                            setTimeout(() => { vscode.commands.executeCommand('workbench.action.closeActiveEditor'); }, 900);
                        }).then(() => {
                            // console.log(vscode.window.activeTextEditor.document);
                            vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(path.dirname(file)), true).then(() => {
                                vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(file));
                            });
                        });
                });
            }).then(() => {
                // vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(path.dirname(file)), true).then(() => {
                //     vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(file));
                // });
            });
        } else {
            vscode.workspace.openTextDocument(file).then(document => {
                vscode.window.showTextDocument(document, {
                    viewColumn: 1,
                    preserveFocus: false,
                }).then(document => {
                    const editor = vscode.window.activeTextEditor;
                    const position = editor.selection.active;
                    const newPosition = position.with(editor.document.lineCount + 1 , 0);
                    editor.selection = new vscode.Selection(newPosition, newPosition);
                        vscode.window.activeTextEditor.edit(function (edit) {
                            edit.insert(newPosition,
                                os.EOL + "## "
                                + getISOWeek
                                + getEmoji
                                + dateFns.format(new Date(), `${dateFormat}`)
                                + " " + `${selectString.substr(0,49)}`
                                + os.EOL + os.EOL);
                        }).then(() => {
                            editor.revealRange(editor.selection, vscode.TextEditorRevealType.Default);
                        });
                });
            });
        }
    }

    /**
     * memoTemplate
     */
    private memoTemplate(title: string, date: string): string {
        if (!this.memotemplate) {
            return "# " + `${date}` + " " + `${title}` + os.EOL + os.EOL;
        }
        const content = fs.readFileSync(this.memotemplate).toString();
        const params = {
            ".Title": title,
            ".Date": date
        };
        return Mustache.render(content, params);
    }
}
