'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { memoConfigure } from './memoConfigure';

export class memoConfig extends memoConfigure {

    constructor() {
        super();
    }

    /**
     * Config
     */
    public Config() {
        vscode.workspace.openTextDocument(path.normalize(path.join(this.memoconfdir, 'config.toml'))).then(document =>{
            vscode.window.showTextDocument(document, {
                viewColumn: 1,
                preserveFocus: true,
                preview: false
            });
        });
    }
}
