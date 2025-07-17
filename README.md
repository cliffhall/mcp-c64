# MCP Server for Commodore 64 Assembly Development

## Status
**WIP** - Still getting a working C64 development workflow together

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
  * Add var `VICE_PATH` pointing to the VICE `x64sc` program on your system (if different from example)
