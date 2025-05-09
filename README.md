# uvscode

> [!NOTE]
> This extension is not associated with astral!

## Features

Automatically select the Python interpreter path given by [uv](https://docs.astral.sh/uv/) based on the current file.
This will execute one of the following commands and set its output as the current interpreter:

* `uv python find --script $scriptname` if a PEP 723 compatible script-tag is found (within the first 50 lines). Note that this only works if the environment has been already created (by running `uv run $scriptname` at least once)
* `uv python find` otherwise

Per default, this will happen every time a different file is activated. This behaviour can be changed over the toggle in the status bar.
Additionally, there is a command to manually trigger setting the interpreter.

## Requirements

uvscode requires [uv](https://docs.astral.sh/uv/) to be installed and in the path.

## Commands

uvscode adds the following commands:

* `uvscode.toggleTrackingActiveFile`: Toggles whether to automatically select the interpreter based on the current file when changing files
* `uvscode.setInterpreter`: Sets the interpreter for the currently active file
* `uvscode.run`: Runs the current file with uv

## Extension Settings

This extension contributes the following settings:

* `uvscode.autoSetInterpreter`: Automatically set the interpreter when switching files

## Known Issues

* The environment must have been created by calling `uv run $scriptname` first
* If no workspace is opened, the public API of the Python extension does not allow changing the interpreter

## Release Notes

### 0.0.1

Initial release of uvscode
