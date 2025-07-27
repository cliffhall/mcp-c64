; ============================
; main.asm - C64 HIRES line demo using line_draw_library.asm
; Starts in HIRES mode, launches dots outward from center
; Each SPACE press launches a new dot at increasing angle
; ============================

            *= $0801        ; BASIC loader
.byte $0c, $08, $0a, $00, $9e, $20, $32, $30, $36, $34, $00, $00, $00
            *= $0810

            jmp Main

.include "line_draw_library.asm"

; ----------------------------
; Constants and zero page
; ----------------------------
VIC_BANK      = $DD00
SCREEN_CTRL   = $D011
COLOR_RAM     = $D800
SCREEN_RAM    = $0400
BITMAP_RAM    = $2000
KEYBOARD      = $DC01
RASTER        = $D012
BORDER_COLOR  = $D020
BG_COLOR      = $D021

MAX_DOTS      = 16

ZP_DOT_X      = $C0  ; 16 bytes for X positions
ZP_DOT_Y      = $D0  ; 16 bytes for Y positions
ZP_DOT_ANGLE  = $E0  ; 16 bytes for angle
ZP_DOT_ACTIVE = $F0  ; 16 bytes for flags
ZP_TMP_IDX    = $AF
ZP_TMP_ANGLE  = $AE

; ----------------------------
; Main Routine
; ----------------------------
Main:
    sei
    lda #$36        ; Bank 0: $0000-$3FFF (bitmap at $2000, screen at $0400)
    sta VIC_BANK    ; $DD00
    lda #$3B        ; Enable bitmap mode, 25 rows
    sta SCREEN_CTRL ; $D011
    lda #$18        ; $D018: bitmap at $2000, screen at $0400
    sta $D018
    lda #0
    sta BG_COLOR
    sta BORDER_COLOR

    ; Clear screen RAM
    ldx #0
    lda #$00
ClearScreen:
    sta SCREEN_RAM,x
    sta SCREEN_RAM+$100,x
    sta SCREEN_RAM+$200,x
    sta SCREEN_RAM+$2E8,x ; up to $07E7
    inx
    bne ClearScreen

    ; Clear color RAM
    ldx #0
    lda #$00
ClearColor:
    sta COLOR_RAM,x
    sta COLOR_RAM+$100,x
    sta COLOR_RAM+$200,x
    sta COLOR_RAM+$300,x
    inx
    bne ClearColor

    ; Clear bitmap RAM
    ldx #0
    lda #0
ClearBitmap:
    sta BITMAP_RAM,x
    sta BITMAP_RAM+$100,x
    sta BITMAP_RAM+$200,x
    sta BITMAP_RAM+$300,x
    sta BITMAP_RAM+$400,x
    sta BITMAP_RAM+$500,x
    sta BITMAP_RAM+$600,x
    sta BITMAP_RAM+$700,x
    sta BITMAP_RAM+$800,x
    sta BITMAP_RAM+$900,x
    sta BITMAP_RAM+$A00,x
    sta BITMAP_RAM+$B00,x
    sta BITMAP_RAM+$C00,x
    sta BITMAP_RAM+$D00,x
    sta BITMAP_RAM+$E00,x
    sta BITMAP_RAM+$F00,x
    inx
    bne ClearBitmap

    cli
    lda #0
    sta ZP_TMP_ANGLE

Forever:
    jsr WaitVBL

    ; Keyboard matrix scan for space bar (row 7, col 4)
    lda #$7F
    sta $DC00       ; Select row 7 (all bits 1 except bit 7)
    lda $DC01
    and #$10        ; Bit 4 is 0 when space is pressed
    bne SkipNewDot
    jsr LaunchDot
WaitForRelease:
    lda $DC01
    and #$10
    beq WaitForRelease
SkipNewDot:
    jsr UpdateDots
    jmp Forever     ; Keep looping forever

; ----------------------------
; Wait for VBL (RASTER = 0)
; ----------------------------
WaitVBL:
    lda RASTER
Wait1:
    cmp RASTER
    beq Wait1
    rts

; ----------------------------
; LaunchDot - create new dot at center
; ----------------------------
LaunchDot:
    ldx #0
FindSlot:
    lda ZP_DOT_ACTIVE,x
    beq FoundSlot
    inx
    cpx #MAX_DOTS
    bcs NoSlot
    jmp FindSlot
FoundSlot:
    lda #1
    sta ZP_DOT_ACTIVE,x
    lda #128        ; Center X
    sta ZP_DOT_X,x
    lda #100        ; Center Y
    sta ZP_DOT_Y,x
    lda ZP_TMP_ANGLE
    sta ZP_DOT_ANGLE,x
    clc
    lda ZP_TMP_ANGLE
    adc #16         ; Increment angle by 16 (about 22.5 degrees)
    sta ZP_TMP_ANGLE
NoSlot:
    rts

; ----------------------------
; UpdateDots - move all active dots
; ----------------------------
UpdateDots:
    ldx #0
LoopDots:
    lda ZP_DOT_ACTIVE,x
    beq NextDot

    ; Load X, Y
    lda ZP_DOT_X,x
    sta ZP_X
    lda ZP_DOT_Y,x
    sta ZP_Y

    ; Angle in A, step = 2 px in X
    lda ZP_DOT_ANGLE,x
    ldx #2
    jsr MoveDotAlongLine

    ; Store back new X, Y
    lda ZP_X
    sta ZP_DOT_X,x
    lda ZP_Y
    sta ZP_DOT_Y,x

    ; Plot new dot
    jsr PlotDot

    ; If offscreen, deactivate
    lda ZP_X
    cmp #0
    bcc Deactivate
    cmp #255        ; Changed from 320 to match library's byte range
    bcs Deactivate
    lda ZP_Y
    cmp #0
    bcc Deactivate
    cmp #200
    bcs Deactivate
    jmp NextDot
Deactivate:
    lda #0
    sta ZP_DOT_ACTIVE,x
NextDot:
    inx
    cpx #MAX_DOTS
    bcc LoopDots
    rts

Hang:
    jmp Hang
