# MCP Server for Commodore 64 Assembly Development

## Status
**WIP** - 
* Development setup working (64tass assembler, VICE C64 emulator)
* MCP Server and REPL working

## Requirements

## Local Setup
* **Node + npm** - Javascript runtime environment
  * <a href="https://nodejs.org/en/download" target="_blank">Install</a> the latest stable Node release (comes with npm).

* **VICE** - The Versatile Commodore Emulator
  * [Manual](https://vice-emu.sourceforge.io/manual/vice.pdf)
  * [Download binary for your platform](https://vice-emu.sourceforge.io/index.html#download)

* **64Tass** - The 6502 assembler for C64
  * [Manual](https://tass64.sourceforge.net/)
  * Install
    * MacOSX - `brew install tass64`
    * Windows - [Download the latest binary](https://sourceforge.net/projects/tass64/files/binaries/)
    
* **.env** - Environment file
  * Create file `.env`  in the root of the project by copying `.env-example` 
  * Add vars
  * `ASSEMBLER` - executable name (full path if not in PATH)
  * `VICE_PATH` - pointing to the VICE `x64sc` program on your system (if different from example)
  * `SRC_PATH`  - pointing to your assembly source folder
  ```bash
    ASSEMBLER=64tass
    SRC_PATH=/Users/cliffhall/Projects/mcp-c64/asm/hello
    VICE_PATH=/Users/cliffhall/vice/x64sc.app/Contents/MacOS/x64sc
  ```
