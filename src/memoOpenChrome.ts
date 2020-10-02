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
    public async OpenChrome() {
        this.readConfig();

        // await vscode.commands.executeCommand('markdown.showPreviewToSide').then(() => {
        // // await vscode.commands.executeCommand('markdown-preview-enhanced.openPreview').then(() => {
        //     setTimeout(() => { Ω
        //         vscode.commands.executeCommand('editor.action.webvieweditor.selectAll').then(() => {
        //             // setTimeout(() => { 
        //                 vscode.commands.executeCommand('copy');

        //             // }, 1000);
        //         });
        //     }, 5000);
        //     // await vscode.commands.executeCommand('workbench.action.');
        // });

        // Issue #214: Error "Runtime error encountered: No Chrome installations found."
        //
        chromeLauncher.launch({
            // startingUrl: 'data:text/html, <html contenteditable>',
            // startingUrl: data:text/html, <html contenteditable><style>body{background-color:#272822;color:#ddd;margin:50px 100px}</style>
            startingUrl: this.memoOpenChromeCustomizeURL,
            chromeFlags: ['--no-default-browser-check']
            // https://peter.sh/experiments/chromium-command-line-switches/
            // startingUrl: 'data:text/html, <html contenteditable><style type="text/css">*{caret-color: blue;}</style>',
        }).then(chrome => {
            // console.log(`Chrome debugging port running on ${chrome.port}`);
        });
    }
}

