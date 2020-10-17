
'use strict';

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { memoConfigure } from './memoConfigure';

const localize = nls.config({ messageFormat: nls.MessageFormat.file })();

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
