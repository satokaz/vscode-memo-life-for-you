'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as dateFns from 'date-fns';
import * as nls from 'vscode-nls';
import { memoConfigure } from './memoConfigure';

const localize = nls.config(process.env.VSCODE_NLS_CONFIG)();

export class memoRedate extends memoConfigure {

    constructor() {
        super();
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

        // this.memodir を扱うために readConfig() を実行
        this.readConfig();

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

                    // birthtime などを維持したいので fs.copySync ではなく fs.renameSync を利用する
                    fs.renameSync(activeFilename.fsPath, path.join(path.dirname(activeFilename.fsPath), dateFns.format(new Date(), 'YYYY-MM-DD') + tempfilename));

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

                    vscode.window.showInformationMessage(localize('reDateUpdateToda', 'Updated file name to today\'s date: {0}', newFilename), { modal: true },
                    {
                        title: localize('close', 'Close'),
                        isCloseAffordance: true
                    });
                break;
            }
        });
    }
}
