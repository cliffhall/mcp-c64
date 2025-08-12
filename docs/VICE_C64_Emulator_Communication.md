# VICE Commodore 64 Emulator Communication and Debugging

*Conversation about communicating with VICE emulator from scripts and debugging machine language programs assembled with 64tass*

---

## Question: How to communicate with VICE Commodore 64 emulator from a script?

Beyond launching it, how can I communicate with the VICE Commodore 64 emulator from a script?

### Answer: Communication Methods

The VICE Commodore 64 emulator offers several ways to communicate with it programmatically from external scripts:

#### Monitor Interface
VICE includes a built-in monitor (debugger) that can be accessed remotely:
- Use the `-remotemonitor` command line option when launching VICE
- Connect via TCP/IP (default port 6510) using telnet or custom scripts
- Send monitor commands like `g` (go), `t` (step), `m` (memory dump), etc.
- Useful for debugging, memory inspection, and execution control

#### Binary Monitor
For more efficient communication:
- Use `-binarymonitor` instead of text-based remote monitor
- Implements a binary protocol for faster data exchange
- Better suited for automated tools and real-time interaction

#### Snapshot Files
For state management:
- Save machine state: `save_snapshot filename.vsf`
- Load machine state: `load_snapshot filename.vsf` 
- Can be scripted to save/restore specific execution points

#### Autostart and Script Files
- Use `-autostart` to automatically load and run programs
- Create `.d64` disk images programmatically and have VICE mount them
- Pre-configure settings via configuration files

#### Example Script Approach
A typical workflow might involve:
1. Launch VICE with remote monitor enabled
2. Connect via socket from your script
3. Send commands to load programs, set breakpoints, examine memory
4. Parse responses to monitor execution or extract data

Since you're working with JavaScript/TypeScript, you could use Node.js with the `net` module to establish TCP connections to VICE's monitor interface. This would let you create sophisticated automation scripts for testing, debugging, or demonstration purposes.

---

## Follow-up: Setting Breakpoints for Machine Language Programs

Tell me more about setting breakpoints. I want to run machine language programs that have been assembled using 64tass.

### Answer: Comprehensive Breakpoint Guide

When working with machine language programs assembled with 64tass and debugging them in VICE, you have several powerful breakpoint options:

#### Setting Breakpoints via Monitor

**Address Breakpoints:**
```
break $c000          ; Break when PC reaches $c000
break load $d000     ; Break on any load from $d000
break store $0400    ; Break on any store to $0400
break exec $c000     ; Break on execution at $c000 (same as 'break')
```

**Conditional Breakpoints:**
```
break $c000 if .a == $ff        ; Break at $c000 if accumulator is $ff
break load $d020 if .x > $10    ; Break on load from $d020 if X > $10
break store if .y == $00        ; Break on any store if Y is zero
```

**Memory Range Breakpoints:**
```
break load $0400-$07ff          ; Break on access to screen memory
break store $d000-$dfff         ; Break on writes to I/O area
```

#### Using 64tass Debug Information

64tass can generate debug symbols that VICE can use:

**In your 64tass source:**
```asm
; Use meaningful labels
main_loop:
    lda #$01
    sta $d020
    jmp main_loop

init_routine:
    ldx #$00
clear_loop:
    sta $0400,x
    inx
    bne clear_loop
    rts
```

**Assemble with debug info:**
```bash
64tass -a -L listing.txt -l labels.txt program.asm
```

**In VICE monitor, load symbols:**
```
ll "labels.txt"              ; Load label file
break main_loop              ; Now you can use label names
break init_routine
```

#### Automated Breakpoint Setup

You can create a VICE command script file:

**debug_script.txt:**
```
ll "labels.txt"
break main_loop
break init_routine if .a == $00
watch store $d020
g $c000
```

**Launch VICE with script:**
```bash
x64sc -moncommands debug_script.txt program.prg
```

#### Useful Monitor Commands for ML Debugging

**Execution Control:**
```
g $c000                     ; Go/run from address $c000
z                          ; Step one instruction
n                          ; Step over (won't enter subroutines)
ret                        ; Run until RTS
```

**Memory and Register Inspection:**
```
m $c000 $c0ff              ; Memory dump
r                          ; Show registers
d $c000                    ; Disassemble from $c000
```

**Watchpoints (useful for I/O):**
```
watch load $dc01           ; Watch keyboard reads
watch store $d020          ; Watch border color changes
```

#### Remote Scripting Example

If you're using the remote monitor from a Node.js/TypeScript script:

```typescript
import * as net from 'net';

const client = new net.Socket();
client.connect(6510, 'localhost', () => {
    // Set up your breakpoints
    client.write('ll "labels.txt"\n');
    client.write('break main_loop\n');
    client.write('break $d020 store\n');
    client.write('g $c000\n');  // Start execution
});

client.on('data', (data) => {
    const response = data.toString();
    if (response.includes('BREAK')) {
        // Handle breakpoint hit
        client.write('r\n');  // Show registers
        // Analyze state, then continue or step
        client.write('g\n');
    }
});
```

#### Pro Tips for ML Debugging

1. **Use meaningful labels** in your 64tass code - they make debugging much easier
2. **Set breakpoints at routine entry points** to verify your program flow
3. **Watch I/O locations** ($d000-$dfff) to see hardware interactions  
4. **Use conditional breakpoints** to catch specific states (like when a counter reaches a value)
5. **Save snapshots** before complex routines so you can quickly return to test different scenarios

---

*Generated from conversation on Tuesday, August 12, 2025*