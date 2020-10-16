'use strict';

import * as vscode from 'vscode';
import * as upath from 'upath';
import { memoConfigure } from './memoConfigure';

export class memoConfig extends memoConfigure {

    constructor() {
        super();
    }

    /**
     * Config
     */
    public Config() {
        vscode.workspace.openTextDocument(upath.normalize(upath.join(this.memoconfdir, 'config.toml'))).then(document =>{
            vscode.window.showTextDocument(document, {
                viewColumn: 1,
                preserveFocus: true,
                preview: false
            });
        });
    }
}
