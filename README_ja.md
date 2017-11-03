# vscode-memo-life-for-you README

これは、VS Code でメモを書くための拡張機能です。

* この拡張機能は [memo (Memo Life For You)](https://github.com/mattn/memo) に影響を受け、VS Code と組み合わせて利用できるようにするために作り始めました(現在は、作成されたファイルを memo コマンドでも VS Code でも有効に活用できることを考え、一部の機能を除き、個別に動作するようになっており、ファイルを開くことに特化しています)
* 構成ファイルである `config.toml` と配置先のディレクトリは、memo コマンドと互換性があります
* Memo: New/Edit/Grep/Config コマンドを実行するために、外部に memo コマンドは必要ありません
* もし、Memo: Serve を使う場合は、memo コマンドをインストールする必要があります

## Features

![alt](https://raw.githubusercontent.com/satokaz/vscode-memo-life-for-you/media/media/vscode-memo-new.gif)

提供されるコマンドは下記のとおりです:

* `Memo: New` - メモを作成 (memo コマンドは必要ありません)
* `Memo: Edit` - 作成されたメモのリストと編集 (memo コマンドは必要ありません)
* `Memo: Grep` - 作成されたメモを検索 (memo コマンドは必要ありません)
* `Memo: Config` - 構成ファイルの編集 (memo コマンドは必要ありません)
* `Memo: Serve` - memo コマンドに組み込まれた http server を起動し、ブラウザで表示 (memo コマンドが必要です)

ユニークなコマンド:

* `Memo: Today's quick Memo` - `YY-MM-DD.md` ファイルに追記 (memo command is not necessary)

### Memo: New

* QuickInput に入力された値をファイル名およびタイトルとして、ファイルを作成
* QuickInput に何も入力せずに Enter を押した場合、日付をベースにした `YY-MM-DD.md` ファイルが作成されます。もし、同じ日付けのファイル名がすでに存在している場合は、上書きせずにそのファイルを開きます
* また、エディタ上で文字列を選択してから、このコマンドを実行すると、選択された文字列がタイトルとファイル名に利用されます
* ファイルは、`Memo: New` コマンドを実行した VS Code インスタンス上で開きます

### Memo: Today's quick Memo

* すでにある `YY-MM-DD.md` を開き、追記を行います。もし、ファイルが存在しない場合は、作成してから開きます
* このコマンドを実行すると開かれたファイルの最下行にタイムスタンプを含んだヘッダが追記されます。(例: `## 2017-10-19 Thu 06:38`)
* また、ISO Week とランダムな絵文字をタイムスタンプに追加することができます。(例: `## [Week: 42/52] 😸 42 2017-10-19 Thu 06:26`)
* また、エディタ上で文字列を選択してから、このコマンドを実行すると、タイムスタンプと共に選択された文字列がタイトル名として挿入されます
* ファイルは、`Memo: Today's quick Memo` コマンドを実行した VS Code インスタンス上で開きます

### Memo: Edit

* このコマンドを実行すると、ファイル名とそのファイルの最初の 1 行をリストして表示します。これは、memo コマンドの `memo list` または `memo edit` に似ています
* QuickInput にキーワードを入力することでリストをフィルタすることが可能です
* 選択されたファイルは、`Memo: Edit` コマンドを実行した VS Code インスタンス上で開きます* また、同時に `Memo Grep` 出力パネルを生成し検索結果を出力します
* また、同時に `Memo List` 出力パネルを生成し一覧を出力します

### Memo: Grep

* VS Code に含まれる ripgrep を利用します
* QuickImput にキーワードを入力することで、検索結果を QuickPicker に表示し選択で開くことができます
* 選択されたファイルを開くと、検索結果の該当行と列にカーソルを移動させます
* 選択されたファイルは、`Memo: Grep` コマンドを実行した VS Code インスタンス上で開きます
* また、同時に `Memo Grep` 出力パネルを生成し検索結果を出力します

#### ripgrep について

QuickPicker 項目は `ripgrep` コマンドの出力から作成されます。 
VS Code に同梱されている `ripgrep` を使用するため、別途インストールする必要はありません。

利用するオプション:

* `--vimgrep` -- Show results with every match on its own line, including line numbers and column numbers.
* `--color never` -- Do not use color in output.
* `-g *.md` -- Include *.md files for searching that match the given glob. 
* `-S` -- Search case insensitively if the pattern is all lowercase.

### Memo: Config

* VS Code で構成ファイルを開きます

### Memo: Serve

* memo コマンドが必要です。この機能が必要ない場合は、memoコマンドをインストールする必要はありません。
* `memo serve` を実行し、memo コマンドの組み込み http サーバを起動し、ブラウザに表示します。プロセスは手動で終了する必要があります。

## About the configuration file

設定ファイルとディレクトリが存在しない場合は、初めに自動的に作成されます。このファイルは、memo コマンドでそのまま使用することもできます。

```yaml
memodir - 作成するメモの配置先ディレクトリを指定 (拡張機能で参照)
editor - 編集に利用するエディタを指定 (拡張機能では参照しない)
column - 表示カラム数 (拡張機能では参照しない)
selectcmd - 使用するセレクタコマンド (拡張機能では参照しない)
grepcmd - 使用する grep コマンド (拡張機能では参照しない)
assetsdir - (拡張機能では参照しない)
pluginsdir - (拡張機能では参照しない)
templatedirfile - (拡張機能では参照しない)
```

デフォルトの構成:

macOS:

```yaml
memodir = "/Users/satokaz/.config/memo/_posts"
editor = "code"
column = 20
selectcmd = "peco"
grepcmd = "/Applications/Visual\\ Studio\\ Code\\ -\\ Insiders.app/Contents/Resources/app/node_modules/vscode-ripgrep/bin/rg -n --no-heading -S ${PATTERN} ${FILES}"
assetsdir = ""
pluginsdir = ""
templatedirfile = ""
```

Windows: 

```yaml
memodir = "C:\\Users\\Sato\\AppData\\Roaming\\memo\\_posts"
editor = "code"
column = 20
selectcmd = "peco"
grepcmd = "grep -nH ${PATTERN} ${FILES}"
assetsdir = ""
pluginsdir = "C:\\Users\\Sato\\AppData\\Roaming\\memo\\plugins"
templatedirfile = ""
templatebodyfile = ""
```

### About the memo command

この拡張機能は、memo コマンドがインストールされていれば全ての機能が利用できますが、memo コマンドは必ずしも必要ではありません。

* `memo` 
   * [memo (Memo Life For You)](https://github.com/mattn/memo)

## Extension Settings

この拡張機能は下記の設定項目を持っています:

* `"memo-life-for-you.memoPath"`: memo コマンドのパス (Serve コマンドを使う場合に必要)
   * ex: Mac/Linux: `"/Users/satokaz/golang/bin/memo"`
   * ex: Windows: `"C:/Users/Sato/go/bin/memo.exe"`
* `"memo-life-for-you.serve-addr"`: server address (Serve コマンドで default: 8080 以外のポートを利用する場合)
   * `memo serve --addr :8083` = ex: "memo-life-for-you.serve-addr": "8083" (default: "8080")
* `"memo-life-for-you.dateFormat"`: date-fns のフォーマット形式 See: https://date-fns.org/v1.29.0/docs/format (default: "YYYY-MM-DD ddd HH:mm")
* `memo-life-for-you.insertISOWeek`: "Memo: Today's quick Memo" コマンド実行時に挿入されるタイトルに ISO Week を追加します
* `memo-life-for-you.insertEmoji`: "Memo: Today's quick Memo" コマンド実行時に挿入されるタイトルに random-Emoji を追加します

## Known Issues

* ファイルを開くと、そのファイルを含むリポジトリ情報が SCM ビューに追加されます。 (See [When I Open Just One File in Initialized Git Folder - Source Control Shows Number of Changed Files · Issue #35555 · Microsoft/vscode](https://github.com/Microsoft/vscode/issues/35555))

## Tanks

* [memo (Memo Life For You)](https://github.com/mattn/memo)

## License

Licensed under the [MIT](LICENSE.txt) License.

**Enjoy!**