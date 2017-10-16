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

* Create a file with the entered value as `title` and `filename`.
* When you press enter with empty, create a file with YY-MM-DD.md.
* The file is opened to the vscode instance that executed the `Memo: Edit` command.

### Memo: Edit

* List the file name and the first line of the file as `memo list` or ` memo edit`.
* Filter by keyword.
* selected file will be opened in the vscode instance that executed the `Memo: Edit` command.
* At the same time, generate `Memo List` output panel which outputs file list.

### Memo: Grep

* By entering keyword, the search results are displayed on Quick Picker.
* Open by selecting a file and move the cursor to the corresponding line
* selected file will be opened in the vscode instance that executed the `Memo: Grep` command
* At the same time, generate `Memo Grep` output panel which outputs file list.

####  Supported grep command

Picker Items is created from the output of `memo grep` command.Therefore, picker items may not be generated correctly depending on the output. It checks with the following command:

| command | |
|---------|-------------------------------|
| grep    | grep -niH ${PATTERN} ${FILES} |
| ag      | ag ${PATTERN} ${DIR}          |

### Memo: Config

* Execute `memo config` and open configure file on VS Code.

### Memo: Serve

* Execute `memo serve`, start the built-in http server of the memo command. and display it in the browser. Manually you need to kill the process manually.

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
* `"memo-life-for-you.serve-addr"`: server address (default: "8080")
   * `memo serve --addr :8083` = ex: "memo-life-for-you.serve-addr": "8083" 
* `"memo-life-for-you.insertTimeInFilename"`
   * `true` (default: false): Insert time (hhmm) in filename (ex : 2017-10-13-`1824-test`.md)

## Known Issues

* If you open a file, the repository information that contains that file will be added to SCM view.
* macOS でしか動かせていない

## License

Licensed under the [MIT](LICENSE.txt) License.

**Enjoy!**