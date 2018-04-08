
'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as dateFns from 'date-fns';
import * as nls from 'vscode-nls';
import * as os from 'os';
import { memoConfigure } from './memoConfigure';

const localize = nls.config(process.env.VSCODE_NLS_CONFIG)();

export class memoTodo extends memoConfigure {

    constructor() {
        super();
    }

    /**
     * Todo.txt
     */
    public Todo() {
        this.readConfig();

        let file: string = 'todo.txt'
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

        file = path.normalize(path.join(this.memodir, 'todo', file));
        // console.log(file);
        try {
            fs.statSync(file);
        } catch(err) {
            fs.writeFileSync(file, "");
        }

        // 選択されているテキストを取得
        // エディタが一つも無い場合は、エラーになるので対処しておく
        let editor = vscode.window.activeTextEditor;
        let selectString: String = editor ? editor.document.getText(editor.selection) : "";

        let memo;
        let project;
        let context;
        let due;
        // let TodocompletionDate: string[];

        vscode.window.showInputBox({
            placeHolder: localize('enterTodo', 'Please enter one line memo'),
            // prompt: "",
            value: `${selectString.substr(0,99)}`,
            ignoreFocusOut: true
        }).then((memo) => {
            if (memo == undefined) { // キャンセル処理: ESC を押した時に undefined になる
                return void 0;
            }
            vscode.window.showInputBox({
                placeHolder: localize('enterTodoProject', 'Please enter Project'),
                value: 'work',
                ignoreFocusOut: true
            }).then((project) => {
                if (project == undefined) { // キャンセル処理: ESC を押した時に undefined になる
                    return void 0;
                }
                project = ` +${project}`;
                vscode.window.showInputBox({
                    placeHolder: localize('enterTodoContext', 'Please enter context'),
                    value: 'office',
                    ignoreFocusOut: true
                }).then((context) => {
                    if (context == undefined) { // キャンセル処理: ESC を押した時に undefined になる
                        return void 0;
                    }
                    context = ` @${context}`;

                    //
                    let date = new Date();
                    let before = new Date();
                    let week = [];
                    for(let i = 0;i < 14;i++) {
                        // week.unshift(date.getDate() - i);
                        week.push(dateFns.format(new Date(date.getFullYear(), date.getMonth(), date.getDate() + i), 'YYYY-MM-DD'));
                    }
                    // console.log(week);
                    //
                    // vscode.window.showInputBox({
                    //     placeHolder: localize('enterTodocompletionDate', 'Please enter completion Date'),
                    //     // value: dateFns.format(new Date(), 'YYYY-MM-DD'),
                    //     value: dateFns.format(new Date(), 'YYYY-MM-DD'),
                    //     ignoreFocusOut: true
                    // })
                    vscode.window.showQuickPick(week, {
                        placeHolder: localize('enterTodocompletionDate', 'Please enter completion Date'),
                        ignoreFocusOut: true,
                        matchOnDescription: true,
                        matchOnDetail: true,
                    }).then((completionDate) => {
                        if (completionDate == undefined) { // キャンセル処理: ESC を押した時に undefined になる
                            return void 0;
                        }
                        vscode.window.showQuickPick(week, {
                            placeHolder: '',
                            ignoreFocusOut: true,
                            matchOnDescription: true,
                            matchOnDetail: true,
                        }).then((due)=> {
                            if (due == undefined) { // キャンセル処理: ESC を押した時に undefined になる
                                return void 0;
                            }
                        
                            // console.log(memo, project, context, due);
                            vscode.workspace.openTextDocument(file).then(document => {
                            vscode.window.showTextDocument(document, {
                                viewColumn: 1,
                                preserveFocus: true,
                            }).then(document => {
                                let completionDate = '----------';
                                let marksComp = "[-]";
                                let marksPrior = "(-)";
                                let creationDate = dateFns.format(new Date(), 'YYYY-MM-DD');
                                const editor = vscode.window.activeTextEditor;
                                const position = editor.selection.active;
                                const newPosition = position.with(editor.document.lineCount + 1 , 0);
                                editor.selection = new vscode.Selection(newPosition, newPosition);
                                editor.edit(function (edit) {
                                        edit.insert(newPosition,
                                            marksComp
                                            + " " + marksPrior
                                            + " " + completionDate
                                            + " " + creationDate
                                            + " " + memo
                                            + project
                                            + context
                                            + ` due:${due}`
                                            + os.EOL);
                                    }).then(() => {
                                        let list: string [] = editor.document.getText().split(os.EOL);
                                        // list.sort();

                                        let listPrior: string [] = [];
                                        let listNonPrior: string [] = [];

                                        // 配列から空行を削除
                                        list.map((v, i) => {
                                            if (v == "") {
                                                return list.splice(i,1);
                                            }
                                            if(v.match(/\([A-Z]\)/g)) {
                                                return listPrior.push(v);
                                            } else {
                                                return listNonPrior.push(v);
                                            }
                                        });
                                        list = listPrior.concat.apply(listPrior.sort(), listNonPrior);

                                        // console.log(listPrior.sort());
                                        // console.log(listNonPrior);

                                        editor.edit((edit)=> {
                                            const position = editor.selection.active;
                                            // const newPosition = position.with(0 , 0);
                                            // edit.replace(new vscode.Range(0, 0, editor.document.lineCount + 1, 0), list.toString());
                                            list.forEach(async (v, i) => {
                                                edit.replace(new vscode.Range(0 + i, 0, 0 + i, 1024), v);
                                            })
                                        });

                                        // console.log(list);
                                        editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenter);
                                    });
                                });
                            });
                        });
                    });
                })
            })
        })
    }
}
