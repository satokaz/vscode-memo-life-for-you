'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as dateFns from 'date-fns';
import * as nls from 'vscode-nls';
import * as os from 'os';
import { items, memoConfigure } from './memoConfigure';

const localize = nls.config({ messageFormat: nls.MessageFormat.file })();

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
        let list: string[] = [];
        let dirlist: string[] = [];
        let openMarkdownPreview: boolean = this.memoEditOpenMarkdown;
        let listMarkdownPreview: boolean = this.memoEditPreviewMarkdown;
        let openMarkdownPreviewUseMPE: boolean = this.openMarkdownPreviewUseMPE;
        let isEnabled: boolean = false; // Flag: opened Markdown Preview (Markdown Enhance Preview)
        let listDisplayExtname: string[] = this.memoListDisplayExtname;
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
            list = readdirRecursively(memodir);
        } catch(err) {
            console.log('err =', err);
        }

        // let listDisplayExtname: string[] = ["md", "txt"];
        // listDisplayExtname　= [];
        // listDisplayExtname が空の場合は、強制的に .md のみ対象にする
        if (listDisplayExtname.length == 0 ) {
            listDisplayExtname　= ["md"];
        } 

        // 取得したファイル一覧を整形
        list = list.filter((v) => {
                for (const value of listDisplayExtname){
                    // console.log(value);
                    if (path.extname(v).match("." + value)) {
                        // console.log(v);  
                        return v;                  
                    }   
                }           
        }).map((v) => {     // .map で配列の中身を操作してから新しい配列を作成する    
            // memodir を削除したパス名を返す
                return (v.split(path.sep).splice(memodir.split(path.sep).length, v.split(path.sep).length).join(path.sep));
        });

        // console.log(listDisplayExtname);

        // メニューアイテムの作成
        for (let index = 0; index < list.length; index++) {
            let v = list[index];

            if (list[index] == '') {
                break;
            }

            let filename: string = path.normalize(path.join(this.memodir, list[index]));
            let fileStat: fs.Stats = fs.statSync(filename);
            let statBirthtime = this.memoEditDispBtime ? (typeof fileStat === 'string') ? "" : dateFns.format(fileStat.birthtime, 'MMM DD HH:mm, YYYY ') : "";
            let statMtime = this.memoEditDispBtime ? (typeof fileStat === 'string') ? "" : dateFns.format(fileStat.mtime, 'MMM DD HH:mm, YYYY ') : "";

            let array = fs.readFileSync(filename).toString().split('\n');
            
            // 先頭一行目だけなので、readline で代替してみたが、遅い...
            // let readFirstLine = async (file) => {
            //     let firstLine: string;
            //     const stream = fs.createReadStream(file, { highWaterMark : 5 });
            //     const rl = readline.createInterface({ input: stream });

            //     for await (const line of rl) {              
            //         rl.pause();
            //         firstLine = line;
            //         break;
            //     }
            //     // rl.close();
            //     // stream.destroy();
            //     return firstLine;
            // };

            // let array = await readFirstLine(filename);
            // console.log("firstLine = ", array);
            
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

            // 出力タブへの出力を生成
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

        vscode.window.showQuickPick<items>(items, {
            ignoreFocusOut: true,
            matchOnDescription: true,
            matchOnDetail: true,
            placeHolder: localize('enterSelectOrFilename', 'Please select or enter a filename...(All items: {0}) ...Today\'s: {1}', items.length, dateFns.format(new Date(), 'MMM DD HH:mm, YYYY ')),
            onDidSelectItem: async (selected:items) => {
                if (selected == undefined || selected == null) {
                    return void 0;
                }

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

// memodir 配下のファイルとディレクトリ一覧を取得
// https://blog.araya.dev/posts/2019-05-09/node-recursive-readdir.html
const readdirRecursively = (dir, files = []) => {
    const dirents = fs.readdirSync(dir, { encoding: 'utf8', withFileTypes: true });
    const dirs = [];
    for (const dirent of dirents) {
      if (dirent.isDirectory()) dirs.push(`${dir}/${dirent.name}`);
      if (dirent.isFile()) files.push(`${dir}/${dirent.name}`);
    }
    for (const d of dirs) {
      files = readdirRecursively(d, files);
    }
    return files;
};
  