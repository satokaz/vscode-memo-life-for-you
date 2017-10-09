# vscode-memo-life-for-you README

This extension is for executing some commands of [memo (Memo Life For You)](https://github.com/mattn/memo) from VS Code.

## Features

sample movie:
https://pic.twitter.com/naH5Z2MSMa


The following commands are supported.

* `Memo: New` - create memo
* `Memo: Edit` - list/edit memo
* `Memo: Grep` - grep memo
* `Memo: Config` - configure
* `Memo: Serve` - start http server

### Memo: New

* `memo new` コマンドに入力された値を渡し、`YY-MM-DD-入力された値.md` のようなファイルを memodir に作成し、オープンする
* **Mac Only**: 何も入力がない場合は、YY-MM-DD.md ファイルが作成し、オープンする 


### Memo: Edit

* `memo list` のようにファイル名とそのファイルの先頭 1 行目をリスト表示。keyword を入力することで絞り込み、選択されたファイルを開く。
* `memo edit` コマンドは利用していない

### Memo: Grep

* keyword を入力することで、memo grep による検索結果を Quick Picker に表示。選択することで、該当するファイルを開き、該当行にカーソルを移動させる
* `memo grep` コマンドの出力から Picker Items を作成 

>**Note:** 統合ターミナルで memo grep すると、出力のファイル名部分が自動的にリンクになるので、Cmd + Click で似たような操作ができる！(この拡張機能は関係ない)

### Memo: Config

* `memo config` による confgigure file を VS Code 上にオープン

### Memo: Serve

* `memo serve` を実行し、memo コマンド内蔵の http server を起動し、ブラウザで表示。手動でプロセスの kill が必要


## Requirements

* `memo` should be installed already
   * [memo (Memo Life For You)](https://github.com/mattn/memo)

example configuration:

```yaml
memodir = "/Users/satokaz/.config/memo"
editor = "code-insiders"
column = 50
selectcmd = "peco"
grepcmd = "grep -niH ${PATTERN} ${FILES}"
assetsdir = "/Users/satokaz/.config/memo/satokaz"
pluginsdir = "/Users/satokaz/.config/memo/satokaz"
templatedirfile = "/Users/satokaz/.config/memo/satokaz/dir.html"
templatebodyfile = "/Users/satokaz/.config/memo/satokaz/body.html"
```

## Extension Settings

This extension contributes the following settings:

* `"memo-life-for-you.memoPath"`: Path to memo command 
   * ex: Mac/Linux: `"/Users/satokaz/golang/bin/memo"`
   * ex: Windows: `"C:/Users/Sato/go/bin/memo.exe"`
* `"memo-life-for-you.memoDir"`: Path to memodir 
   * ex: Mac/Linux: `"/Users/satokaz/.config/memo/_posts"`
   * ex: Windows: `"C:/Users/Sato/AppData/Roaming/memo/_posts"`

## Known Issues

* macOS でしか動かせていない

## License

Licensed under the [MIT](LICENSE.txt) License.

**Enjoy!**