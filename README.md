# vscode-memo-life-for-you README

This extension is for writing notes on VS Code.

* Compatibility of memo command configuration file `config.toml` and placement directory
* Memo: New/Edit/Grep/Config does not require the memo command.
* If you use Memo: Serve, you need to install memo command.
* Inspired by [memo (Memo Life For You)](https://github.com/mattn/memo)

## Features

![alt](https://raw.githubusercontent.com/satokaz/vscode-memo-life-for-you/media/media/vscode-memo-new.gif)

The following commands are supported.

* `Memo: New` - create memo (memo command is not necessary)
* `Memo: Edit` - list/edit memo (memo command is not necessary)
* `Memo: Grep` - grep memo (memo command is not necessary)
* `Memo: Config` - configure (memo command is not necessary)
* `Memo: Serve` - start http server (Requires memo command)

Unique command:

* `Memo: Today's quick Memo` (memo command is not necessary)

### Memo: New

* Create a file with the entered value as `title` and `filename`.
* When you press enter with empty, create a file with `YY-MM-DD.md`. If a file with the same name already exists, it opens the file without overwriting it. 
* When text is selected on the editor and the command is executed, it can be used for title and file name.
* The file is opened to the VS Code instance that executed the `Memo: Edit` command.

### Memo: Today's quick Memo

* Open the `YY-MM-DD.md` file if it exists. If it does not exist, create it and open.
* Every time you open, add a timestamp on the bottom line. example: `## 2017-10-19 Thu 06:38`
* You can insert ISOweek and random-Emoji into the timestamp. example: `## [Week: 42/52] 😸 42 2017-10-19 Thu 06:26`
* When text is selected on the editor and the command is executed, it can be used for title name.

### Memo: Edit

* List the file name and the first line of the file as `memo list` or ` memo edit`.
* Filter by keyword.
* selected file will be opened in the VS Code instance that executed the `Memo: Edit` command.
* At the same time, generate `Memo List` output panel which outputs file list.

### Memo: Grep

* Use ripgrep included in VS Code distribution.
* By entering keyword, the search results are displayed on Quick Picker.
* Open by selecting a file and move the cursor to the corresponding line
* selected file will be opened in the VS Code instance that executed the `Memo: Grep` command
* At the same time, generate `Memo Grep` output panel which outputs file list.

####  Supported grep command

Picker Items is created from the output of `ripgrep` command. Therefore, picker items may not be generated correctly depending on the output. 

You do not need to install it separately to use ripgrep that ships with VS Code.

### Memo: Config

* Open configure file on VS Code.

### Memo: Serve

* Requires memo command. If you do not need this function, you do not need to install the memo command.
* Execute `memo serve`, start the built-in http server of the memo command. and display it in the browser. Manually you need to kill the process manually.

## About the configuration file

If configuration files and directories do not exist, they are automatically created for the first time.
This file can also be used as it is with the memo command.

default configuration:

macOS:

```yaml
memodir = "/Users/satokaz/.config/memo/_post"
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
memodir = "C:\\Users\\Sato\\AppData\\Roaming\\memo\\_post"
editor = "code"
column = 20
selectcmd = "peco"
grepcmd = "grep -nH ${PATTERN} ${FILES}"
assetsdir = ""
pluginsdir = "C:\\Users\\Sato\\AppData\\Roaming\\memo\\plugins"
templatedirfile = ""
templatebodyfile = ""
```

> **For windows:** From the memo command, I do not know how to write the path to execute ripgrep that is included in VS Code. Therefore, it is necessary to set the grep command individually in Windows environment.
(ripgrep command path: `c:\Program Files\Microsoft VS Code Insiders\resources\app\node_modules\vscode-ripgrep\bin\rg`)

### About the memo command

This extension requires the memo command to work correctly.

* `memo` should be installed already
   * [memo (Memo Life For You)](https://github.com/mattn/memo)

## Extension Settings

This extension contributes the following settings:

* `"memo-life-for-you.memoPath"`: Path to memo command (If you use Serve command)
   * ex: Mac/Linux: `"/Users/satokaz/golang/bin/memo"`
   * ex: Windows: `"C:/Users/Sato/go/bin/memo.exe"`
* `"memo-life-for-you.serve-addr"`: server address (If you use Serve command)
   * `memo serve --addr :8083` = ex: "memo-life-for-you.serve-addr": "8083" (default: "8080")
* `"memo-life-for-you.dateFormat"`: Follow format of date-fns. See: https://date-fns.org/v1.29.0/docs/format (default: "YYYY-MM-DD ddd HH:mm")
* `memo-life-for-you.insertISOWeek`: Insert ISO Week when "Memo: Today's quick Memo" is executed
* `memo-life-for-you.insertEmoji`: Insert random-Emoji when "Memo: Today's quick Memo" is executed

## Known Issues

* If you open a file, the repository information that contains that file will be added to SCM view. (See [When I Open Just One File in Initialized Git Folder - Source Control Shows Number of Changed Files · Issue #35555 · Microsoft/vscode](https://github.com/Microsoft/vscode/issues/35555))

## Tanks

* [memo (Memo Life For You)](https://github.com/mattn/memo)

## License

Licensed under the [MIT](LICENSE.txt) License.

**Enjoy!**