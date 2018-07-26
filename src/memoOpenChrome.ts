'use strict';

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { memoConfigure } from './memoConfigure';
import * as chromeLauncher from 'chrome-launcher';


const localize = nls.config(process.env.VSCODE_NLS_CONFIG)();

export class memoOpenChrome extends memoConfigure {
    constructor() {
        super();
    }

    /**
     * Open Chrome
     */
    public OpenChrome() {
        this.readConfig();
        chromeLauncher.launch({
            // startingUrl: 'data:text/html, <html contenteditable>',
            startingUrl: this.memoOpenChromeCustomizeURL,
            chromeFlags: ['--no-default-browser-check']
            // https://peter.sh/experiments/chromium-command-line-switches/
            // startingUrl: 'data:text/html, <html contenteditable><style type="text/css">*{caret-color: blue;}</style>',
        }).then(chrome => {
            console.log(`Chrome debugging port running on ${chrome.port}`);
        });
    }
}

