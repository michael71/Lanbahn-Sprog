// converts lanbahn loco adr/data pairs like
// (set speed of loco #x to y) or loco function data
// to a DCC paket
// formulas mostly taken from JMRI
//      File  NmraPacket.java (c) Bob jacobsen 2001/2003

// examples Loco 211, reverse, F0 on, other functions off
//     functions Sprog Command: O C0 D3 90 83
//     speed 0 Sprog Command:   O C0 D3 3F 00 2C
//     speed 127                O C0 D3 3F 7F 53
//     F0 and F1 on:            O C0 D3 91 82
"use strict";

var hexChar = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];

function byteToHex(b) {
    return hexChar[(b >> 4) & 0x0f] + hexChar[b & 0x0f];
}

exports.functions0to4 = function (addr, f0, f1, f2, f3, f4) {

    var byte = new Array();
    var arg1 = 0x80 |
        (f0 ? 0x10 : 0) |
        (f1 ? 0x01 : 0) |
        (f2 ? 0x02 : 0) |
        (f3 ? 0x04 : 0) |
        (f4 ? 0x08 : 0);
    if ((addr >= 1) && (addr < 100)) {
        // short address form
        byte[0] = addr & 0xFF;
        byte[1] = arg1;
        byte[2] = byte[0] ^ byte[1];
        return (byteToHex(byte[0]) + " " + byteToHex(byte[1]) + " " + byteToHex(byte[2]));
    } else if (addr <= 9999) {
        // long address form
        byte[0] = 192 + ((addr / 256) & 0x3F);
        byte[1] = addr & 0xFF;
        byte[2] = arg1;
        byte[3] = byte[0] ^ byte[1] ^ byte[2];
        return (byteToHex(byte[0]) + " " + byteToHex(byte[1]) + " " + byteToHex(byte[2]) + " " + byteToHex(byte[3]));
    } else {
        return undefined;
    }
}

exports.functions5to9 = function (addr, f0, f1, f2, f3, f4) {

    var byte = new Array();
    var arg1 = 0x80 |
        (f0 ? 0x10 : 0) |
        (f1 ? 0x01 : 0) |
        (f2 ? 0x02 : 0) |
        (f3 ? 0x04 : 0) |
        (f4 ? 0x08 : 0);
    if ((addr >= 1) && (addr < 100)) {
        // short address form
        byte[0] = addr & 0xFF;
        byte[1] = arg1;
        byte[2] = byte[0] ^ byte[1];
        return (byteToHex(byte[0]) + " " + byteToHex(byte[1]) + " " + byteToHex(byte[2]));
    } else if (addr <= 9999) {
        // long address form
        byte[0] = 192 + ((addr / 256) & 0x3F);
        byte[1] = addr & 0xFF;
        byte[2] = arg1;
        byte[3] = byte[0] ^ byte[1] ^ byte[2];
        return (byteToHex(byte[0]) + " " + byteToHex(byte[1]) + " " + byteToHex(byte[2]) + " " + byteToHex(byte[3]));
    } else {
        return undefined;
    }
}

// ONLY for 128 speed steps
exports.speed128 = function (addr, speed, direction) {
    var sprogDcc, tmp, dirbit;
    var byte = new Array();
    dirbit = 0;
    if (direction == 1) {
        dirbit = 0x80;
    }
    if ((addr >= 1) && (addr < 100)) {
        if ((speed < 0) || (speed > 127)) {
            return undefined;
        }
        byte[0] = addr & 0xFF;
        sprogDcc = byteToHex(byte[0]);
        byte[1] = 0x3F;
        sprogDcc = sprogDcc + " " + byteToHex(byte[1]);
        byte[2] = (speed & 0x7F) | dirbit;
        sprogDcc = sprogDcc + " " + byteToHex(byte[2]);
        sprogDcc = sprogDcc + " " + byteToHex(byte[0] ^ byte[1] ^ byte[2]);
        return sprogDcc;
    } else if (addr <= 9999) {
        if ((speed < 0) || (speed > 127)) {
            return undefined;
        }
        // dcc long address
        // first byte Addresses 11000000-11100111 (192-231)(inclusive): 
        // Multi Function Decoders with 14 bit addresses
        byte[0] = (192 + ((addr / 256) & 0x3F));
        sprogDcc = byteToHex(byte[0]);
        byte[1] = addr & 0xFF;
        sprogDcc = sprogDcc + " " + byteToHex(byte[1]);
        byte[2] = 0x3F;
        sprogDcc = sprogDcc + " " + byteToHex(byte[2]);
        byte[3] = (speed & 0x7F) | dirbit;
        sprogDcc = sprogDcc + " " + byteToHex(byte[3]);
        sprogDcc = sprogDcc + " " + byteToHex(byte[0] ^ byte[1] ^ byte[2] ^ byte[3]);
        return sprogDcc;
    } else {
        return undefined;
    }
   
}


// TODO for future use
function speed28(speed) {
    switch (speed) {
    case 0:
        return 0;
    default:
        var tmp = 0;
        if ((speed % 2) === 0) {
            return 17 + (speed / 2);
        } else {
            return 1 + (speed + 1) / 2;
        }
    }
}

/*
 public static byte[] function0Through4Packet(int address, boolean longAddr,
                        boolean f0, boolean f1, boolean f2, boolean f3, boolean f4 ) {
        if (log.isDebugEnabled()) log.debug("f0 through f4 packet "+address);

        if (!addressCheck(address, longAddr)) {
            return null;  // failed!
        }

        // end sanity check, format output

        byte[] retVal;
        int arg1 = 0x80 |
                    ( f0 ? 0x10 : 0) |
                    ( f1 ? 0x01 : 0) |
                    ( f2 ? 0x02 : 0) |
                    ( f3 ? 0x04 : 0) |
                    ( f4 ? 0x08 : 0);

        if (longAddr) {
            // long address form
            retVal = new byte[4];
            retVal[0] = (byte) (192+((address/256)&0x3F));
            retVal[1] = (byte) (address&0xFF);
            retVal[2] = (byte) arg1;
            retVal[3] = (byte) (retVal[0]^retVal[1]^retVal[2]);
        } else {
            // short address form
            retVal = new byte[3];
            retVal[0] = (byte) (address&0xFF);
            retVal[1] = (byte) arg1;
            retVal[2] = (byte) (retVal[0]^retVal[1]);
        }
        return retVal;
    }
*/