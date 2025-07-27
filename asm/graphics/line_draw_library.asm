; ============================
; line_draw_library.asm
; C64 HIRES line drawing & stepping
; Angle input is now scaled to 0-255 for 8-bit compatibility
; ============================

; ----------------------------
; Constants and zero-page temp vars
; ----------------------------
HIRES_BASE     = $A000      ; start of HIRES screen RAM
ZP_X           = $FB
ZP_Y           = $FC
ZP_DX          = $FD
ZP_DY          = $FE
ZP_TEMP        = $FF         ; scratch temp

; ----------------------------
; Bitmask Table for setting individual bits in HIRES (bit 7 to bit 0)
; ----------------------------
bitmask_table:
.byte %10000000, %01000000, %00100000, %00010000, %00001000, %00000100, %00000010, %00000001

; ----------------------------
; Sine Table: 0–90 degrees, scaled 0–255 (46 entries, 2° per step)
; ----------------------------
sin_table:
.byte 0, 9, 18, 27, 36, 45, 53, 62, 70, 78
.byte 86, 94, 101, 109, 116, 122, 129, 135, 141, 147
.byte 152, 157, 162, 167, 171, 175, 179, 183, 186, 189
.byte 192, 195, 197, 199, 201, 202, 204, 205, 206, 206
.byte 207, 207, 207, 207, 207, 207

; ----------------------------
; GetSinCosFromAngle
; Input: A = angle in degrees (0-255 scaled from 0-359)
; Output: ZP_DX = cos component, ZP_DY = sin component
; ----------------------------
GetSinCosFromAngle:
    sta ZP_TEMP     ; Save angle
    lda #64         ; Quarter of full range (256/4)
    cmp ZP_TEMP
    bcc Q2orMore    ; If angle >= 64, check next quarter
Q1:                 ; 0-63
    lda ZP_TEMP
    lsr             ; Divide by 2 for table lookup
    tax
    lda sin_table,x
    sta ZP_DY       ; sin(angle)
    lda #32         ; 90 degrees scaled to 0-255
    sec
    sbc ZP_TEMP
    lsr
    tax
    lda sin_table,x
    sta ZP_DX       ; cos(angle)
    jmp DoneSigns

Q2orMore:
    lda #128        ; Half range check
    cmp ZP_TEMP
    bcc Q3orMore
Q2:                 ; 64-127
    lda #128
    sec
    sbc ZP_TEMP
    lsr
    tax
    lda sin_table,x
    sta ZP_DY
    lda ZP_TEMP
    sec
    sbc #64
    lsr
    tax
    lda sin_table,x
    eor #$FF        ; Negate
    clc
    adc #1
    sta ZP_DX
    jmp DoneSigns

Q3orMore:
    lda #192        ; Three quarter range check
    cmp ZP_TEMP
    bcc Q4
Q3:                 ; 128-191
    lda ZP_TEMP
    sec
    sbc #128
    lsr
    tax
    lda sin_table,x
    eor #$FF        ; Negate
    clc
    adc #1
    sta ZP_DY
    lda #192
    sec
    sbc ZP_TEMP
    lsr
    tax
    lda sin_table,x
    eor #$FF        ; Negate
    clc
    adc #1
    sta ZP_DX
    jmp DoneSigns

Q4:                 ; 192-255
    lda #255
    sec
    sbc ZP_TEMP
    lsr
    tax
    lda sin_table,x
    eor #$FF        ; Negate
    clc
    adc #1
    sta ZP_DY
    lda ZP_TEMP
    sec
    sbc #192
    lsr
    tax
    lda sin_table,x
    sta ZP_DX

DoneSigns:
    rts

; ----------------------------
; Multiply 8-bit A by 8-bit B at addr
; Result >> 8 placed in A (fixed-point scaling)
; ----------------------------
FixedMul:
    ldy #8
    lda #0
    sta ZP_TEMP
    ldx ZP_TEMP
MulLoop:
    asl ZP_TEMP
    rol a
    bcc NoAdd
    clc
    adc ZP_DX
NoAdd:
    dey
    bne MulLoop
    sta ZP_TEMP
    lda ZP_TEMP
    rts

; ----------------------------
; PlotDot (HIRES)
; Input: ZP_X, ZP_Y = screen coordinates (0-319, 0-199)
; ----------------------------
PlotDot:
    lda ZP_Y
    cmp #200
    bcs DonePlot
    lda ZP_X
    cmp #255        ; Stay within byte range
    bcs DonePlot

    ; Get character row and line within character
    lda ZP_Y
    pha             ; Save Y coordinate
    lsr
    lsr
    lsr             ; Y / 8 = character row
    tax             ; Save char row in X
    pla             ; Restore Y coordinate
    and #7          ; Y mod 8 = line within character
    tay             ; Save line offset in Y

    ; Calculate base address for this character row
    txa             ; Get char row back
    asl             ; Multiply by 320 (40 bytes * 8 lines)
    asl
    asl             ; Row * 8
    sta ZP_TEMP
    txa
    asl             ; Row * 2
    asl             ; Row * 4
    asl             ; Row * 8
    asl             ; Row * 16
    asl             ; Row * 32
    clc
    adc ZP_TEMP     ; Add row * 8 = row * 40

    ; Add X position / 8 for character column
    pha             ; Save row offset
    lda ZP_X
    lsr
    lsr
    lsr             ; X / 8 = character column
    clc
    adc ZP_TEMP     ; Add to row offset

    ; Add bitmap base address
    adc #<HIRES_BASE
    sta $FB
    lda #>HIRES_BASE
    adc #0          ; Add carry
    sta $FC

    ; Get bit position within byte (7 = leftmost, 0 = rightmost)
    lda ZP_X
    and #7          ; X mod 8 = bit position
    tax
    lda bitmask_table,x  ; Get appropriate bit mask
    ora ($FB),y     ; OR with existing screen byte
    sta ($FB),y     ; Write back to screen

DonePlot:
    rts

; ----------------------------
; MoveDotAlongLine
; Input: ZP_X, ZP_Y = current position
;        A = angle (0-255)
;        X = step size (0-255)
; Output: updated ZP_X, ZP_Y
; ----------------------------
MoveDotAlongLine:
    sta ZP_TEMP        ; Save angle
    stx $02            ; Save step size in unused ZP
    jsr GetSinCosFromAngle

    ; Handle X movement (cos)
    lda ZP_DX          ; Get cosine
    sta ZP_TEMP
    lda $02            ; Get step size
    ldx ZP_TEMP        ; Put cosine in X
    jsr FixedMul       ; Multiply step * cos
    clc
    adc ZP_X           ; Add to current X
    sta ZP_X

    ; Handle Y movement (sin)
    lda ZP_DY          ; Get sine
    sta ZP_TEMP
    lda $02            ; Get step size again
    ldx ZP_TEMP        ; Put sine in X
    jsr FixedMul       ; Multiply step * sin
    sta ZP_TEMP        ; Save result
    lda ZP_Y
    clc
    adc ZP_TEMP        ; Add to current Y
    sta ZP_Y
    rts

; ----------------------------
; DrawLine
; Input: ZP_X, ZP_Y = start point
;        A = angle (0–359)
;        X = length (number of steps)
;        Y = step size (pixel size, 0–255)
; ----------------------------
DrawLine:
    sta ZP_TEMP        ; angle
    stx ZP_DX          ; length counter
    sty ZP_DY          ; step size
LineLoop:
    lda ZP_TEMP
    ldx ZP_DY
    jsr MoveDotAlongLine
    jsr PlotDot
    dec ZP_DX
    bne LineLoop
    rts
