'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import * as nls from 'vscode-nls';
// import {MDDocumentContentProvider, isMarkdownFile, getMarkdownUri, showPreview} from './MDDocumentContentProvider'

const localize = nls.config(process.env.VSCODE_NLS_CONFIG)();

// vscode.QuickPickItem に ln, col, index, filename を追加した items を interface で作成
export interface items extends vscode.QuickPickItem {
    ln: number;
    col: number;
    index: number;
    filename: string;
    isDirectory: boolean;
    birthtime: Date;
    mtime: Date;
}

export class memoConfigure {
    public _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    public _waiting : boolean;
    public memopath: string;
    public memoaddr: string;
    public  memodir: string;
    public memotemplate: string;
    public memoconfdir: string;
    public memoDateFormat: string;
    public memoISOWeek: boolean = false;
    public memoEmoji: boolean = false;
    private memoConfig = [];
    public memoGutterIconPath: string;
    public memoGutterIconSize: string;
    public memoWithRespectMode: boolean = false;
    public memoGrepLineBackgroundColor: string;
    public memoGrepKeywordBackgroundColor: string;
    public memoEditPreviewMarkdown: boolean;
    public memoEditOpenMarkdown: boolean;
    public memoEditOpenNewInstance: boolean;
    public memoEditDispBtime: boolean = false;
    public memoListSortOrder: string;
    public memoGrepOrder: string;
    public memoGrepUseRipGrepConfigFile: boolean = false;
    public memoGrepUseRipGrepConfigFilePath: string;
    public memoTodoUserePattern: string;
    public memoNewFilenameFromClipboard: boolean;
    public memoNewFilenameFromSelection: boolean;
    public memoNewFilNameDateSuffix: string;
    public openMarkdownPreviewUseMPE: boolean;
    public memoOpenChromeCustomizeURL: string;
    public memoTyporaExecPath: string;
    
    public options: vscode.QuickPickOptions = {
        ignoreFocusOut: true,
        matchOnDescription: true,
        matchOnDetail: true,
        placeHolder: ''
    }

    public cp_options = {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024
    }

    constructor() {
        this.init(); // 初期化を同期にしたいので async/await で実行する
        // this.memoGrepChannel = vscode.window.createOutputChannel("Memo Grep");
        this.updateConfiguration();
        this._waiting = false;

        vscode.workspace.onDidChangeConfiguration(() => {
            // console.log("onDidChangeConfiguration in memoGrep");
            this.updateConfiguration();
        });

        fs.watchFile(path.normalize(path.join(this.memoconfdir, 'config.toml')), (curr, prev) => {
            // console.log(curr);
            // this.updateConfiguration();
            this.readConfig();
        });
    }

    async init(){
        await this.setMemoConfDir(); // 初回に memoconfdir が必要なので、createConfig で this.memoconfigdir に値を格納する
        await this.readConfig();
    }

    /**
     * setMemoConfDir
     */
    public setMemoConfDir() {
        if (process.platform == "win32") {
            this.memoconfdir = process.env.APPDATA;
            if (this.memoconfdir == "") {
                this.memoconfdir = path.normalize(path.join(process.env.USERPROFILE, "Application Data", "memo"));
            }
            this.memoconfdir = path.normalize(path.join(this.memoconfdir, "memo"));
        } else {
            this.memoconfdir = path.normalize(path.join(process.env.HOME, ".config", "memo"));
        }
        return void 0;
    }

    /**
     * readConfig
     */
    public readConfig() {
        let editor;
        let memodir;
        let memotemplate;
        let list = fs.readFileSync(path.normalize(path.join(this.memoconfdir, "config.toml"))).toString().split('\n');

        // console.log('readConfig =', list);
        list.forEach(async function (v, i) {
            // console.log(v.split("=")[1]);
            if (v.match(/^memodir =/)) {
                memodir = v.split("=")[1].replace(/"/g, "").trim();
            }
            if (v.match(/^memotemplate =/)) {
                memotemplate = v.split("=")[1].replace(/"/g, "").trim();
            }
            if (v.match(/^editor =/)) {
                editor = v.split("=")[1].replace(/"/g, "").trim();
            }
        });

        this.memodir = memodir;
        this.memotemplate = memotemplate;
        return void 0;
    }

    /**
     * checkMemoDir
     */
    public checkMemoDir() {
        if(!this.memodir) {
            vscode.window.showErrorMessage(localize('memodirCheck', 'memodir is not set in config.toml'));
            return;
        }

        // memodir に設定されたディレクトりが実際に存在するかチェック
        try{
            fs.statSync(this.memodir);
        } catch(err) {
            // console.log(err);
            vscode.window.showErrorMessage(localize('memodirAccessCheck', 'The directory set in memodir does not exist'));
            return;
        }
    }

    /**
     * updateConfiguration
     */
    public updateConfiguration() {
        this.memopath = path.normalize(vscode.workspace.getConfiguration('memo-life-for-you').get<string>('memoPath'));
        this.memoaddr = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('serve-addr');
        this.memoDateFormat = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('dateFormat');
        this.memoISOWeek = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('insertISOWeek');
        this.memoEmoji = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('insertEmoji');
        this.memoGutterIconPath = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('gutterIconPath');
        this.memoGutterIconSize = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('gutterIconSize');
        this.memoWithRespectMode = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('withRespectMode');
        this.memoEditDispBtime = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('displayFileBirthTime');
        this.memoGrepLineBackgroundColor = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('grepLineBackgroundColor');
        this.memoGrepKeywordBackgroundColor = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('grepKeywordBackgroundColor');
        this.memoEditPreviewMarkdown = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('listMarkdownPreview');
        this.memoEditOpenMarkdown = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('openMarkdownPreview');
        this.memoEditOpenNewInstance = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('openNewInstance');
        this.memoListSortOrder = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('listSortOrder'); //birthtime or mtime or filename
        this.memoGrepOrder = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('grepOrder');
        this.memoGrepUseRipGrepConfigFile = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('memoGrepUseRipGrepConfigFile');
        this.memoGrepUseRipGrepConfigFilePath = vscode.workspace.getConfiguration('memo-life-for-you').inspect<string>('memoGrepUseRipGrepConfigFilePath').globalValue;
        this.memoTodoUserePattern = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('memoTodoUserePattern');
        this.memoNewFilenameFromClipboard = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('memoNewFilenameFromClipboard');
        this.memoNewFilenameFromSelection = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('memoNewFilenameFromSelection');
        this.memoNewFilNameDateSuffix = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('memoNewFilNameDateSuffix');
        this.openMarkdownPreviewUseMPE = vscode.workspace.getConfiguration('memo-life-for-you').get<boolean>('openMarkdownPreviewUseMPE');
        this.memoOpenChromeCustomizeURL = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('openChromeCustomizeURL');
        this.memoTyporaExecPath = vscode.workspace.getConfiguration('memo-life-for-you').get<string>('TyporaExecPath');
    }

    get onDidChange() {
        return this._onDidChange.event;
    }

    update(uri) {
        if (!this._waiting) {
            this._waiting = true;
            setTimeout(() => {
                this._waiting = false;
                this._onDidChange.fire(uri);
            }, 300);
        }
    }
}
