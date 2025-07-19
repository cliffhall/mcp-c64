* = $0801 ; BASIC load address
  .word $080d ; Link to next BASIC line
  .word 10 ; Line number
  .byte $9e, $32, $30, $36, $31, $00 ; SYS 2061 (start address)
  .word $0000 ; End of BASIC

SET_TEXT_COLOR   = $0286 ; Set text color
SET_BORDER_COLOR = $d020 ; Set border color
SET_SCREEN_COLOR = $d021 ; Set screen color
CHROUT           = $ffd2 ; Output character
RESET_OUTPUT     = $FFCC ; Reset output to screen
SCREEN_COLOR     = $90   ; Black background
TEXT_COLOR       = $05   ; White text
CLRSCR           = $e544 ; Clear screen
.enc "none"
start:
  ;jsr CLRSCR
  lda SCREEN_COLOR
  sta SET_BORDER_COLOR
  sta SET_SCREEN_COLOR
  lda TEXT_COLOR
  sta SET_TEXT_COLOR
  jsr RESET_OUTPUT
  ldy $0        ; Index for string
loop:
  lda message,y ; Load next character from message
  beq done      ; End of string (true if null terminator loaded)
  jsr CHROUT    ; output character
  rts
  iny           ; Increment index
  jmp loop      ; Repeat for next character
done:
  rts           ; Return from subroutine (back to BASIC)

message:
  .text 'hello world' ; String data
  .byte 0 ; Null terminator
