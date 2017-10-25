# Change Log

All notable changes to the "vscode-memo-life-for-you" extension will be documented in this file.

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