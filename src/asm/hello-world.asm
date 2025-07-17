* = $0801 ; BASIC load address
  .word $080d ; Link to next BASIC line
  .word 10 ; Line number
  .byte $9e, $32, $30, $36, $31, $00 ; SYS 2061 (start address)
  .word $0000 ; End of BASIC
start:
  lda #$00 ; Black background
  sta $d020
  sta $d021
  lda #$0f ; White text
  sta $d020
  lda #$01
  sta $0286
  jsr $e544 ; Clear screen
  ldy #0 ; Index for string
  ldx #$00 ; Initialize X for character color
loop:
  lda message,y ; Load character from message
  beq done ; End of string
  jsr $ffd2 ; Print character (example subroutine)
  iny
  jmp loop
done:
  rts

message:
  .text "Hello, world!" ; String data
  .byte 0 ; Null terminator
