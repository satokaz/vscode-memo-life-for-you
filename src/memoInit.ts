'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as upath from 'upath';
import * as tomlify from 'tomlify-j0.4';
import * as nls from 'vscode-nls';


const localize = nls.config({ messageFormat: nls.MessageFormat.file })();

/**
 * config.toml を作るための interface
 */
interface IMemoConfig {
    memodir: string;
    memotemplate: string;
	editor: string;
	column: number;
    selectcmd: string;
	grepcmd: string;
	assetsdir: string;
	pluginsdir: string;
    templatedirfile: string;
    templatebodyfile: string;
}

export class memoInit {
    public memoconfdir: string;
    // private memoGrepChannel: vscode.OutputChannel;
    // private memoListChannel: vscode.OutputChannel;
    constructor() {
        // console.log('memoInit');
        this.init(); // 初期化を同期にしたいので async/await で実行する
    }

    async init(){
        await this.setMemoConfDir(); // 初回に memoconfdir が必要なので、createConfig で this.memoconfigdir に値を格納する
        await this.createConfig();
        // await this.readConfig();
    }

    /**
     * setMemoConfDir
     */
    public setMemoConfDir() {
        if (process.platform == "win32") {
            this.memoconfdir = process.env.APPDATA;
            if (this.memoconfdir == "") {
                this.memoconfdir = upath.normalize(upath.join(process.env.USERPROFILE, "Application Data", "memo"));
            }
            this.memoconfdir = upath.normalize(upath.join(this.memoconfdir, "memo"));
        } else {
            this.memoconfdir = upath.normalize(upath.join(process.env.HOME, ".config", "memo"));
        }
        console.log(this.memoconfdir);
        return void 0;
    }

    /**
     * createConfig
     */
    public createConfig() {
        fse.pathExists(this.memoconfdir, (err, exists) => {
            if (!exists) {
                // memo ディレクトリが存在しているか確認しなければ、memo dir, _posts dir と plugins dir を作成
                fse.mkdirpSync(this.memoconfdir, {mode: 0o700});
                fse.mkdirpSync(upath.normalize(upath.join(this.memoconfdir, '_posts')), {mode: 0o700});
                fse.mkdirpSync(upath.normalize(upath.join(this.memoconfdir, 'plugins')), {mode: 0o700});
                fs.writeFileSync(upath.normalize(upath.join(this.memoconfdir, 'config.toml')), this.cfgtoml(this.memoconfdir), {mode: 0o600});
                vscode.window.showInformationMessage(localize('createConfig', 'vscode memo life for you: {0} directory created', this.memoconfdir));
            } else {
                // config.toml が存在しているかチェック
                fse.pathExists(upath.normalize(upath.join(this.memoconfdir, "config.toml")), (err, exists) => {
                    if (!exists) {
                        fs.writeFileSync(upath.normalize(upath.join(this.memoconfdir, 'config.toml')), this.cfgtoml(this.memoconfdir));
                        vscode.window.showInformationMessage(localize('createConfigFile', "vscode memo life for you: {0} created", upath.normalize(upath.join(this.memoconfdir, "config.toml"))));
                    }
                });
            }
        });
        return;
    }

    // /**
    //  * readConfig
    //  */
    // public readConfig() {
    //     let editor;
    //     let memodir;
    //     let list = fs.readFileSync(path.normalize(path.join(this.memoconfdir, "config.toml"))).toString().split(os.EOL);

    //     // console.log('readConfig =', list);
    //     list.forEach(async function (v, i) {
    //         // console.log(v.split("=")[1]);
    //         if (v.match(/^memodir =/)) {
    //             memodir = v.split("=")[1].replace(/"/g, "").trim();
    //         }
    //         if (v.match(/^editor =/)) {
    //             editor = v.split("=")[1].replace(/"/g, "").trim();
    //         }
    //     });

    //     this.memodir = memodir;
    //     return void 0;
    // }

    /**
     * cfgtoml
     * @param confDir
     */
    public cfgtoml(confDir) {
        let config: IMemoConfig = {
            memodir: process.env.MEMODIR == undefined ? upath.normalize(upath.join(confDir, "_posts")) : process.env.MEMODIR,
            memotemplate: "",
            editor: process.env.EDITOR == undefined ? "code" : process.env.EDITOR,
            column: 20,
            selectcmd: "peco",
            grepcmd: (process.platform == "win32") ? "grep -nH ${PATTERN} ${FILES}" : upath.normalize(upath.join(vscode.env.appRoot, "node_modules", "vscode-ripgrep", "bin", "rg").replace(/\s/g, '\\ ')) + ' -n --no-heading -S ${PATTERN} ${FILES}',
            assetsdir: "",
            pluginsdir: upath.normalize(upath.join(confDir, "plugins")),
            templatedirfile: "",
            templatebodyfile: "",
        }

        return tomlify(config, function (key, value) {
            let context = this;
            let path = tomlify.toKey(context.path);
            if (/^column/.test(path)) {
                return Math.floor(value).toString();
            }
            return false;
        }, '  ');
    }
}
