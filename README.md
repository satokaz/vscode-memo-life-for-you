# vscode-memo-life-for-you README

[Japanese README is here](https://github.com/satokaz/vscode-memo-life-for-you/blob/master/README_ja.md)

This extension is for writing notes in the markdown format to the VS code.
Notes are placed in a single directory and are managed with filename based on date.

![alt](https://raw.githubusercontent.com/satokaz/vscode-memo-life-for-you/assets/images/vscode-memo_new_demo.gif)

* Compatibility of memo command configuration file `config.toml` and placement directory
* Memo: New/Edit/Grep/Config does not require the memo command.
* If you use Memo: Serve, you need to install memo command.
* Inspired by [memo (Memo Life For You)](https://github.com/mattn/memo)

## Features

![alt](https://raw.githubusercontent.com/satokaz/vscode-memo-life-for-you/assets/images/vscode-memo_commands.png)

The following commands are supported.

* `Memo: New` - create memo (memo command is not necessary)
* `Memo: Edit` - list/edit memo (memo command is not necessary)
* `Memo: Grep` - grep memo (memo command is not necessary)
* `Memo: Config` - configure (memo command is not necessary)
* `Memo: Serve` - start http server (Requires memo command)

Unique command (memo command is not necessary):

* `Memo: Today's quick Memo` - Append to the file of today's date
* `Memo: Re:Date` - Change the date included in the file name to today's date
* `Memo: Todo` - Output items matching the specified pattern (experimental)
* `Memo: Open Memo Folder` - Open the folder where the memo is stored in the new instance

### Memo: New

* Create a file with the entered value as `title` and `filename`.
* When you press enter with empty, create a file with `YY-MM-DD.md`. If a file with the same name already exists, it opens the file without overwriting it. 
* When text is selected on the editor and the command is executed, it can be used for title and file name.
* The file is opened to the VS Code instance that executed the `Memo: Edit` command.
* The file is opened with `preview` state.
* Markdown Preview can be displayed at the same time by setting option `memo-life-for-you.openMarkdownPreview`

### Memo: Today's quick Memo

![alt](https://raw.githubusercontent.com/satokaz/vscode-memo-life-for-you/assets/images/vscode-memo_quicknote.gif)

* Open the `YY-MM-DD.md` file if it exists. If it does not exist, create it and open.
* Every time you open, add a timestamp on the bottom line. example: `## 2017-10-19 Thu 06:38`
* You can insert ISOweek and random-Emoji into the timestamp. example: `## [Week: 42/52] 😸 42 2017-10-19 Thu 06:26`
* When text is selected on the editor and the command is executed, it can be used for title name.
* Since the writing is done, the file is opened with `not preview`.

### Memo: Edit

![alt](https://raw.githubusercontent.com/satokaz/vscode-memo-life-for-you/assets/images/vscode-memo_list_normal_preview.gif)

* List the file name and the first line of the file as `memo list` or ` memo edit`.
* Filter by keyword.
* You can move the list with the keyboard (up/down cursor keys). And you can preview file contents
* Markdown Preview can be displayed at the same time by setting option `memo-life-for-you.openMarkdownPreview`.
* selected file will be opened in the VS Code instance that executed the `Memo: Edit` command.
* The file is opened with `preview` state.
* At the same time, generate `Memo List` output panel which outputs file list.

#### About markdown display during file selection

![alt](https://raw.githubusercontent.com/satokaz/vscode-memo-life-for-you/assets/images/vscode-memo_list_preview.gif)

* it is also possible to display Markdown Preview by setting `"memo-life-for-you.listMarkdownPreview": true`. However, in order to use this function, the [Markdown preview Enhanced](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced) extension must be installed.
* Markdown preview is displayed only when operating the keyboard.
* You can cancel by pressing the `ESC` key. 

### Memo: Grep

![alt](https://raw.githubusercontent.com/satokaz/vscode-memo-life-for-you/assets/images/vscode-memo_grep_demo.gif)

* Use `ripgrep` included in VS Code distribution.
* By entering keyword or pattern, the search results are displayed on Quick Picker.
* Open by selecting a file and move the cursor to the corresponding line and column
* selected file will be opened in the VS Code instance that executed the `Memo: Grep` command
* The file is opened with `preview` state.
* At the same time, generate `Memo Grep` output panel which outputs file list.

#### built-in ripgrep options

Picker Items is created from the output of `ripgrep` command. Therefore, picker items may not be generated correctly depending on the output. 

You do not need to install it separately to use ripgrep that ships with VS Code.

Options to use:

* `--vimgrep` -- Show results with every match on its own line, including line numbers and column numbers.
* `--color never` -- Do not use color in output.
* `-g *.md` -- Include *.md files for searching that match the given glob. 
* `-S` -- Search case insensitively if the pattern is all lowercase.

#### ripgrep configuration file (Available in vscode 1.22 or later (ripgrep 0.8.1))

You can specify options individually by preparing the ripgrep configuration file.

If `memo-life-for-you.memoGrepUseRipGrepConfigFile` is set to `true`, `$HOME/.ripgreprc (Windows example: `C:\Users\Sato\.ripgreprc`)` is used as the configuration file.

In addition, you can specify the configuration file. To use an arbitrary file, set the absolute path of the configuration file in `memo-life-for-you.memoGrepUseRipGrepConfigFilePath`. (Example: `"memo-life-for-you.memoGrepUseRipGrepConfigFilePath": "/Users/satokaz/.vscode-ripgreprc"`)

If the configuration file does not exist, an error occurs.

The following option is mandatory;

```
--vimgrep
```

Same settings as built-in options:

```
--vimgrep
--color never
--glob=*.md
--smart-case
```

> See: https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md#configuration-file

### Memo: Config

* Open configure file on VS Code.

### Memo: Serve

* Requires memo command. If you do not need this function, you do not need to install the memo command.
* Execute `memo serve`, start the built-in http server of the memo command. and display it in the browser. Manually you need to kill the process manually.

### Memo: Todo (experimental)

* Output items matching the specified pattern. The default pattern is `^.*@todo.*?:`. 
* It matches the pattern by writing `@todo:` as shown below

```md
### todo example

* [ ] @todo: Submit to customer due:2018-04-18
* [x] Thank Mom for the meatballs @phone @todo: Impression of meatball
- @todo: Get back to the boss

```

![alt](https://raw.githubusercontent.com/satokaz/vscode-memo-life-for-you/assets/images/vscode-memo_todo.png)


## About the configuration file

If configuration files and directories do not exist, they are automatically created for the first time.

![alt](https://raw.githubusercontent.com/satokaz/vscode-memo-life-for-you/assets/images/vscode-memo_Initialize.png)

This file can also be used as it is with the memo command.

```yaml
memodir - Destination directory of memo file (Required for this extension)
editor - editor command (not used by this extension)
column - Number of display columns (not used by this extension)
selectcmd - selector command (not used by this extension)
grepcmd - grep command (not used by this extension)
assetsdir - (not used by this extension)
pluginsdir - (not used by this extension)
templatedirfile - (not used by this extension)
```

default configuration:

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

[Better&#32;TOML&#32;-&#32;Visual&#32;Studio&#32;Marketplace](https://marketplace.visualstudio.com/items?itemName=bungcip.better-toml): Recommend to handle TOML file Extension

> **For windows:** From the memo command, I do not know how to write the path to execute ripgrep that is included in VS Code. Therefore, it is necessary to set the grep command individually in Windows environment.
(ripgrep command path: `c:\Program Files\Microsoft VS Code Insiders\resources\app\node_modules\vscode-ripgrep\bin\rg`)

### About the memo command

If you use Serve command, This extension requires the memo command to work correctly.

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
* `memo-life-for-you.displayFileBirthTime`: Display birthtime of file in `Memo: Edit` additionally (default: false)

    ![alt](https://raw.githubusercontent.com/satokaz/vscode-memo-life-for-you/assets/images/vscode-memo-display-birthtime_en.png)

* `memo-life-for-you.grepLineBackgroundColor`: Search results show keyword background color
* `memo-life-for-you.grepKeywordBackgroundColor`: Search results show line background color
* `memo-life-for-you.openMarkdownPreview`: Open Markdown Preview at the same time as opening the file in the editor (default: false)
* `memo-life-for-you.openNewInstance`: Launch a new instance to create a new memo
* `memo-life-for-you.listSortOrder`: Controls the order of Memo: List display. Selectable from `filename` or `birthtime` or `mtime`
* `memo-life-for-you.memoGrepUseRipGrepConfigFile`: Do you want ripgrep to work with the configuration file (default: $HOME/.ripgreprc)
* `memo-life-for-you.memoGrepUseRipGrepConfigFilePath`: If you set memoGrepUseRipGrepConfigFile to ture and want to use ripgrep config file located further in a specific place, set the path of config file (example: /Users/satokaz/.vscode-ripgreprc)
* `memo-life-for-you.memoTodoUserePattern`: Define a pattern to recognize as Todo. (default: ^.*@todo.*?:)


## tips

### Transpare quickitem list

![alt](https://raw.githubusercontent.com/satokaz/vscode-memo-life-for-you/assets/images/vscode-memo_transparentize_menu.png)

You can transparentize the quickitem list which displays the file list and search results.
However, this setting also affects the sidebar.

```json
"workbench.colorCustomizations": {
    "sideBar.background": "#262626DD" // For a Dark theme 
    // "sideBar.background": "#F0F0F0DD"  //For a light theme
},
```
### If the focus is lost

todo


## Known Issues

* If you open a file, the repository information that contains that file will be added to SCM view. (See [When I Open Just One File in Initialized Git Folder - Source Control Shows Number of Changed Files · Issue #35555 · Microsoft/vscode](https://github.com/Microsoft/vscode/issues/35555))

## Tanks

* [memo (Memo Life For You)](https://github.com/mattn/memo)

## License

Licensed under the [MIT](LICENSE.txt) License.

**Enjoy!**