# vscode-memo-life-for-you README

This extension is for executing some commands of [memo (Memo Life For You)](https://github.com/mattn/memo) from VS Code.

## Features

<blockquote class="twitter-video" data-lang="ja"><p lang="ja" dir="ltr">mattn/memo で作成した資産を vscode からも利用できないかと勉強がてら拡張機能の作成にチャレンジしているが、形になったものは vscode が memo のセレクタだった。何を言っているかわからないと思うが grep と edit のセレクタだった。戸惑っている <a href="https://t.co/naH5Z2MSMa">pic.twitter.com/naH5Z2MSMa</a></p>&mdash; Kazuyuki Sato (@satokaz) <a href="https://twitter.com/satokaz/status/917247810205999105?ref_src=twsrc%5Etfw">2017年10月9日</a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

The following commands are supported.

* `Memo: New` - create memo
* `Memo: Edit` - list/edit memo
* `Memo: Grep` - grep memo
* `Memo: Config` - configure
* `Memo: Serve` - start http server

### Memo: New

* YY-MM-DD-入力された値.md のようなファイル名を作成し、オープンする
* **Mac Only**: 何も入力がない場合は、YY-MM-DD.md ファイルが作成し、オープンする 

### Memo: Edit

* memo edit のようにファイル名をリスト表示。keyword を入力することで絞り込み可能。memo list の機能も兼ねる

### Memo: Grep

* keyword を入力することで、memo grep による検索結果を Quick Picker に表示。選択することで、該当するファイルを開き、該当行にカーソルを移動させる

>**Note:** 統合ターミナルで memo grep すると、出力のファイル名部分が自動的にリンクになるので、Cmd + Click で似たような操作ができる！(この拡張機能は関係ない)

### Memo: Config

* memo c による confgigure file を VS Code 上にオープン

### Memo: Serve

* memo コマンド内蔵の http server を起動し、ブラウザで表示。再起動は、手動で kill した後にさ


## Requirements

* `memo` should be installed already
   * [memo (Memo Life For You)](https://github.com/mattn/memo)

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