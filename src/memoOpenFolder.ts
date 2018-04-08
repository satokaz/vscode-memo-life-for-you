
'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as dateFns from 'date-fns';
import * as nls from 'vscode-nls';
import * as os from 'os';
import { memoConfigure } from './memoConfigure';

const localize = nls.config(process.env.VSCODE_NLS_CONFIG)();

export class memoOpenFolder extends memoConfigure {
    constructor() {
        super();
        // console.log('memoOpenFolder');
        // console.log(this.memodir);
        // console.log('vscode.Uri =', vscode.Uri.file(this.memodir));
    }

    /**
     * Open Dir
     */
    public OpenDir() {
        this.readConfig();
        let folderUrl = vscode.Uri.file(this.memodir);
        vscode.commands.executeCommand("vscode.openFolder", folderUrl, true);
    }
}
