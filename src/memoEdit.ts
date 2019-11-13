'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as dateFns from 'date-fns';
import * as nls from 'vscode-nls';
import * as os from 'os';
import { items, memoConfigure } from './memoConfigure';

const localize = nls.config(process.env.VSCODE_NLS_CONFIG)();

export class memoEdit extends memoConfigure  {
    public memoListChannel: vscode.OutputChannel;
    constructor() {
        super();
        this.memoListChannel = vscode.window.createOutputChannel("Memo List");
    }

    /**
     * Edit
     */
    public async Edit() {
        this.readConfig();
        let items: items[] = [];
        let memopath = this.memopath;
        let memodir = this.memodir;
        let list: string[];
        let dirlist: string[] = [];
        let openMarkdownPreview: boolean = this.memoEditOpenMarkdown;
        let listMarkdownPreview: boolean = this.memoEditPreviewMarkdown;
        let openMarkdownPreviewUseMPE: boolean = this.openMarkdownPreviewUseMPE;
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
            list = fs.readdirSync(memodir, this.cp_options) as string[];
        } catch(err) {
            console.log('err =', err);
        }

        // fs.readdir(this.memodir, ((err, files) => {
        //     console.log(files);
        //     files = files.filter(function(v, i) {
        //         return (path.extname(v) == ".md");
        //     });
        //     files = files.sort(function(a,b) {
        //         return (a < b ? 1 : -1);
        //     });
        //     console.log('list2 = ', files);
        //     return files;
        // }));

        // .md file のみで配列を作り直しながら、YYYY-MM のディレクトリだけ集めた配列を作成
        list = list.filter(function(v, i) {
            if(path.extname(v) == ".md") {
                return (path.extname(v) == ".md");
            } else {
                if (fs.statSync(path.join(memodir,v)).isDirectory()) {
                    if (v.match(/^[0-9]{4}-[0-9]{2}/)) {
                        dirlist.push(v);
                    }
                }
            }
        });

        // console.log('dirlist =', dirlist);

        // 新しいものを先頭にするための sort
        // if (this.memoListOrder == 'descending'){
        //     list = list.sort(function(a,b) {
        //         return (a < b ? 1 : -1);
        //     });
        // }

        // ディレクトリリストの処理
        // items.push({
        //     "label": `$(package) アーカイブ`,
        //     "description": "",
        //     "detail": "",
        //     "ln": null,
        //     "col": null,
        //     "index": null,
        //     "filename": "",
        //     isDirectory: true
        //  });

        // console.log('list =', list);

        for (let index = 0; index < list.length; index++) {
            let v = list[index];

            if (list[index] == '') {
                break;
            }

            let filename: string = path.normalize(path.join(this.memodir, list[index]));
            let fileStat: fs.Stats = fs.statSync(filename);
            let statBirthtime = this.memoEditDispBtime ? (typeof fileStat === 'string') ? "" : dateFns.format(fileStat.birthtime, 'MMM DD HH:mm, YYYY ') : "";
            let statMtime = this.memoEditDispBtime ? (typeof fileStat === 'string') ? "" : dateFns.format(fileStat.mtime, 'MMM DD HH:mm, YYYY ') : "";

            // console.log(fs.statSync(filename));
            // console.log('birthtime =', statBirthtime);

            let array = fs.readFileSync(filename).toString().split('\n');

            items.push({
                "label": `$(calendar) ` + list[index],
                "description": `$(three-bars) ` + array[0],
                "detail": this.memoEditDispBtime ? localize('editBirthTime', '$(heart) Create Time: {0} $(clock) Modified Time: {1} ', statBirthtime, statMtime) : "",
                "ln": null,
                "col": null,
                "index": index,
                "filename": path.normalize(path.join(this.memodir, list[index])),
                "isDirectory": false,
                "birthtime": fileStat.birthtime,
                "mtime": fileStat.mtime
            });

            this.memoListChannel.appendLine('file://' + path.normalize(path.join(this.memodir, list[index])) + `\t` + array[0]);
            this.memoListChannel.appendLine('');
        }

        // "memo-life-for-you.listSortOrder" で sort 対象の項目を指定
        // sort 結果は常に新しいものが上位にくる降順
        switch (this.memoListSortOrder) {
            case "filename":
                // console.log('filename');
                items = items.sort(function(a, b) {
                    return (a.filename < b.filename ? 1 : -1);
                });
                break;
            case "birthtime":
                // console.log('birthtime');
                items = items.sort(function(a, b) {
                    return (a.birthtime.getTime() < b.birthtime.getTime() ? 1 : -1);
                });
                break;
            case "mtime":
                // console.log('mtime');
                items = items.sort(function(a, b) {
                    return (a.mtime.getTime() < b.mtime.getTime() ? 1 : -1);
                });
                break;
        }

        // console.log("items =", items)

        // let previousFile = vscode.window.activeTextEditor.document.uri;

        vscode.window.showQuickPick<items>(items, {
            ignoreFocusOut: true,
            matchOnDescription: true,
            matchOnDetail: true,
            placeHolder: localize('enterSelectOrFilename', 'Please select or enter a filename...(All items: {0}) ...Today\'s: {1}', items.length, dateFns.format(new Date(), 'MMM DD HH:mm, YYYY ')),
            onDidSelectItem: async (selected:items) => {
                if (selected == undefined || selected == null) {
                    return void 0;
                }

                // if (selected.isDirectory == true) {
                //     console.log('アーカイブを選択 1');
                // }
                // let filename = path.normalize(path.join(memodir, selected.filename));

                // console.log(selected.label);
                // console.log(isEnabled);

                if (listMarkdownPreview) {
                    if (isEnabled) {
                        vscode.commands.executeCommand('workbench.action.focusPreviousGroup').then(async () =>{
                            // Markdown-enhance
                            return vscode.commands.executeCommand('markdown-preview-enhanced.syncPreview');
                            // Original
                            // await vscode.commands.executeCommand('markdown.refreshPreview');
                        });
                        isEnabled = false;
                    }
                }

                if (listMarkdownPreview) {
                    // 選択時に markdown preview を開く場合。要 Markdown Preview Enhance 拡張機能
                    await vscode.workspace.openTextDocument(selected.filename).then(async document => {
                        await vscode.window.showTextDocument(document, {
                            viewColumn: 1,
                            preserveFocus: true,
                            preview: true
                        })
                    }).then(async() => {
                        await vscode.commands.executeCommand('markdown-preview-enhanced.openPreview').then(async () => {
                        // await vscode.commands.executeCommand('markdown.showPreviewToSide').then(async () => {
                            // markdown preview を open すると focus が移動するので、focus を quickopen に戻す作業 1 回目
                            vscode.commands.executeCommand('workbench.action.focusQuickOpen');
                        });
                        // さらにもう一度実行して focus を維持する (なんでだろ? bug?)
                        await vscode.commands.executeCommand('workbench.action.focusQuickOpen');
                    });
                    // もう一回! (bug?)
                    await vscode.commands.executeCommand('workbench.action.focusQuickOpen');
                    isEnabled = true;
                } else {
                    // 選択時に markdown preview を開かない設定の場合
                    await vscode.workspace.openTextDocument(selected.filename).then(async document =>{
                        vscode.window.showTextDocument(document, {
                            viewColumn: 1,
                            preserveFocus: true,
                            preview: true
                        })
                    })
                }
            }
        }).then(async function (selected) {   // When selected with the mouse
            if (selected == undefined || selected == null) {
                if (listMarkdownPreview) {
                    //キャンセルした時の close 処理
                    await vscode.commands.executeCommand('workbench.action.closeActiveEditor').then(() => {
                            vscode.commands.executeCommand('workbench.action.focusPreviousGroup').then(() => {
                                // vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                            });
                    });
                }
                // Markdown preview を閉じる
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                return void 0;
            }

            await vscode.workspace.openTextDocument(path.normalize(selected.filename)).then(async document => {
                await vscode.window.showTextDocument(document, {
                        viewColumn: 1,
                        preserveFocus: true,
                        preview: true
                }).then(async editor => {
                    if (listMarkdownPreview) {
                        if (openMarkdownPreview) {
                            if (openMarkdownPreviewUseMPE) {
                                // vscode.window.showTextDocument(document, vscode.ViewColumn.One, false).then(editor => {
                                // Markdown-Enhance
                                // await vscode.commands.executeCommand('markdown.showPreviewToSide').then(() =>{
                                await vscode.commands.executeCommand('markdown-preview-enhanced.openPreview').then(() =>{
                                    vscode.commands.executeCommand('workbench.action.focusPreviousGroup');
                                });
                            // });
                            } else {
                                // MPE preview を close してから built-in preview を開く
                                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                                await vscode.commands.executeCommand('markdown.showPreviewToSide').then(() => {
                                    vscode.commands.executeCommand('workbench.action.focusPreviousGroup');
                                });
                            }
                        } else {
                            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                        }
                    } else if (openMarkdownPreview) {
                        if (openMarkdownPreviewUseMPE) {
                            await vscode.commands.executeCommand('markdown-preview-enhanced.openPreview').then(() =>{
                                vscode.commands.executeCommand('workbench.action.focusPreviousGroup');
                            });
                        } else {
                            await vscode.commands.executeCommand('markdown.showPreviewToSide').then(() => {
                                vscode.commands.executeCommand('workbench.action.focusPreviousGroup');
                            });
                        }
                    }
                });
            });
        });
    }
}
