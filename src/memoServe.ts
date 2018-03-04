
'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as nls from 'vscode-nls';
import { memoConfigure } from './memoConfigure';

const localize = nls.config(process.env.VSCODE_NLS_CONFIG)();

export class memoServe extends memoConfigure {

    constructor() {
        super();
    }

    /**
     * Serve
     */
    public Serve() {
        // memopath に設定されたコマンドが実行可能かチェック
        console.log(this.memopath);
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
}
