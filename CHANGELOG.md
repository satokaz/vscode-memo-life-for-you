# Change Log

All notable changes to the "vscode-memo-life-for-you" extension will be documented in this file.
## 0.5.2

* fix: Fixed documents for MPE (PR #50: @hotchpotch)
* refactor: Update Dependency to vscode 1.49
* refactor: Update Dependency to gulp v4 and vscode-nls v5 
* refactor: Update  Dependency to date-fns v2.16.1. About changes: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
* chroe: chrome-launcher and fs-extra package updates
* feat: Issue #43. Added memo-life-for-you.listDisplayExtname setting to allow customizable listed file extensions. 

## 0.5.1

* feat: support memotemplate (PR #44: @tkt989)
* chroe: Update Run webpack when debugging

## 0.5.0

* chore: Adopt webpack
* feat: Add a snippet to insert the date
* refactor: node-emoji instead of random-emoji
* add: Open with Typora. macOS only

## 0.4.9

* Add `Memo: Open Chrome with <html contenteditable>` command to start chrome in simple notepad mode.

## 0.4.8

* Add setting: `memo-life-for-you.openMarkdownPreviewUseMPE`: If `memo-life-for-you.openMarkdownPreview` is set to `true`, use `Markdown Preview Enhanced` (https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced) to open preview (default: false)"

## 0.4.7

* Add setting: `memo-life-for-you.memoNewFilenameFromClipboard`: Use the string stored in OS clipboard as the name of the newly created file (defaut: false),
* Add setting: `memo-life-for-you.memoNewFilenameFromSelection`: Use the selected string on vscode as the name of the newly create file (default: false),
* Add setting: `memo-life-for-you.memoNewFilNameDateSuffix`: Add a date related suffix after filename prefix (YYYY-MM-DD). The added string is passed to datefns.format(). See: https://date-fns.org/v1.29.0/docs/format (default: empty)

## 0.4.6

* Support paste from os clipboard to supplement the file name of Memo: New.
* Fix: For the first time on that day, it may not be displayed when you run Memo:Today.


## 0.4.5

* Memo: Grep Maximum result limit is 10,000
* Experimental implementation of Memo: Todo

## 0.4.4

* ripgrep configuration file support

## 0.4.3

* Revert: Use os.EOL instead of '\n'. There was a problem with the operation in Windows

## 0.4.2

* Fixed ReDate does not work

## 0.4.1

* Fix localization

## 0.4.0

* [Breaking Change regarding the usage of vscode-ripgrep #27](https://github.com/satokaz/vscode-memo-life-for-you/issues/27)
* Add `openNewInstance` setting (oly Memo: New and  QuickMemo)
* Add 'Memo: Todo' command (incompete)

## 0.3.2

* Adopt octicons

## 0.3.1

* `Memo: Re:Date` Use fs.rename() to hold file stat

## 0.3.0

* Fix editor closing process at cancel

## 0.2.9

* Fix localize () was not applied

## 0.2.8 

* "listMarkdownPreview": true and "openMarkdownPreview": false setting, adding a process to close preview when opening a file
* Add open Markdown Preview when executing `Memo: List/Edit`
* Add alt key menu to withRespect mode 

## 0.2.7

* `Memo: Re:Date` - Added command to update old date filename to latest date filename
* `Memo: Edit` - Change command name to `Memo: List/Edit`
* Display file creation date in `memo: List/Edit`
* Add menu localization (Japanese only)
* Add message localization
* Add specify gutter icon path and size when displaying search results
* Add withRespect mode
* Add option to display Markdown Preview when selecting and opening a file

## 0.2.6

* Sorry to update frequently!
* Memo: Edit/Grep: If you cancel with the `ESC` key, close the editor opened by the search result

## 0.2.5

* Fixed that "Memo: New/Quick Memo" will get an error if activeTextEditor does not exist

## 0.2.4

* 2nd Try! default memodir was wrong. Fix from _post to _posts.

## 0.2.3

* Fixed a problem that memo directory can not be created correctly due to upgrade of tomlify-j0.4. revert to 2.2.1

## 0.2.2 

* default memodir was wrong. Correctly `_posts` 
* Supports column and result highlights with "Memo: Grep"

## 0.2.1

* Pass the selected text on the editor to the value of QuickInput

## 0.2.0

* Changed to implementation that does not depend on memo command (except for Serve)

## 0.1.1

* not clear OutputChannel when executing Memo: Edit/Grep
* Memo: Edit/Grep quickpick itme is not reflected even if it is selected with the mouse

## 0.0.11

* Added onDidSelectItem event to "memo edit / Grep" quick-pick. 
* Added not to automatically open outputchannel. If necessary manually


## 0.0.10

* The value entered in `memo new` is not handled correctly as a title

## 0.0.9

* Add `Memo: Quick Memo` command
* Delete: `"memo-life-for-you.insertTimeInFilename"` option

## 0.0.8

* Fix handling of config.toml file path

## 0.0.7 

* Changed to get configuration information from `memo config --cat`
## 0.0.6 

* The handling `memo-life-for-you.nativeNew` and `memo-life-for-you.insertTimeInFilename` was incorrect 

## 0.0.4

* Check existing file in built-in command

## 0.0.3

* Add "memo new" like file creation command
* Add Insert time (hhmm) in filename setting

## 0.0.2

* Add onDidChangeConfiguration support
* Add serve --addr support

## 0.0.1
- Initial release