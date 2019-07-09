'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as nls from 'vscode-nls';
import { memoConfigure } from './memoConfigure';

const localize = nls.config(process.env.VSCODE_NLS_CONFIG)();

export class memoOpenTypora extends memoConfigure {

    constructor() {
        super();
    }
    
    /**
     * OpenTypora
     */
    public OpenTypora() {
        this.readConfig();
        // memopath に設定されたコマンドが実行可能かチェック
        console.log(this.memopath);

        // memo-life-for-you.TyporaExecPath
        // if(this.memoTyporaExecPath === ""){
        //     vscode.window.showErrorMessage(localize('typoraCheck', 'memo-life-for-you.TyporaExecPath is empty.'));
        //     return;
        // }

        if (!vscode.window.activeTextEditor){
            return;
        }

        let editor = vscode.window.activeTextEditor;
        let doc = editor.document;

        // console.log(doc.fileName);

        try{
            if (process.platform == "darwin") {
                cp.execSync('open -b ' + 'abnerworks.Typora ' + doc.fileName);
            } else {
                vscode.window.showErrorMessage("This command is only available for macOS.");
                return;
            }
            // console.log('open -b ' + 'abnerworks.Typora' + ' --args ' + doc.fileName);
            // cp.execSync('open ' + this.memoTyporaExecPath + ' --args ' + doc.fileName);
        } catch(err) {
            console.log(err);
            vscode.window.showErrorMessage(localize('typoraNotFound', 'Typora.app Not Found'));
            return;
        }
    }
}
