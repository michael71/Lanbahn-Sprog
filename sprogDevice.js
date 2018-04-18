// sprog_device.js

// UPDATED on 06 April 2018 to work with newer (current) version of
// "serialport" module (serialport@6.1.1)
// see https://stackoverflow.com/questions/46023151/serialport-lib-parsers-readline-is-not-a-function-error-nodejs


// handles sending of packages via SPROG II v3 or SPROG3
// 
// TODO: when no LOCO command for 10 secs, set speed to 0
// TODO: error msg, when no SPROG connected

/*jslint node: true */
/*jslint plusplus: true */
/*jslint bitwise: true */
"use strict";

var DEBUG = true;
const DEBUG_SEND = true;
var SIMULATION = false;

var SPROG = "/dev/ttyS0"; // sprog serial port
const serialport = require("serialport");
const parsers = serialport.parsers;

// Use a `>` as a line terminator
const parser = new parsers.Readline({
  delimiter: '>'
});

var packet = require('./sprogDccPacket.js');

// arrays for dcc packets (index = loco address)
var dccS = [];
var func04 = []; // same for function data F0..F4
var func58 = []; // same for function data F5..F8
var func912 = []; // same for function data F9..12

var immediateCmd;
var statusCount = 170;

// for "slot" machine
var lastLoco = 0;    // adr for loco speed
var lastF04 = 0;     // adr for function data F0..F4
var lastF58 = 0;     // adr for function data F5..F8
var lastF912 = 0;    // adr for function data F9..F12

var IDLE = 0;
var WAITING = 1;
var status = IDLE; // status of the serial port "handshake" between
// this program and the SPROG

const myPort = new serialport(SPROG, {
    baudRate: 115200,    // high speed for Pi-SPROG !!
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    flowControl: false,
});

myPort.pipe(parser);

myPort.on('open', () => console.log('Port open'));

parser.on('data', handledata); 

myPort.on('error', (err) => console.error("serial error", err));

function handledata (data) {
        if (DEBUG) {
            console.log('received: ' + data); 
        }
  

        if (data.indexOf("S") > -1) {
           // Formula taken from JMRI

            var i = data.indexOf('h');
            if (i > -1) {
                var value = data.substring(i + 7, i + 11);
                var current = parseInt(value,16) * 488 / 47;
                console.log("I[mA] = " + Math.round(current) + '(' + value + ')');
            }
        }
        status = IDLE;

};



function sendString(s) {
    if (!SIMULATION) {
        myPort.write(s + "\r", function (err, results) {
            status = WAITING;
            if (err !== undefined) {
                console.log('serial err ' + err);
            }
        });
    }
}

/*  setTimeout(function () {
        if (DEBUG) {
            console.log("waiting...");
        }
        var command = '\r';
        myPort.write(command, function (err, results) {
            status = WAITING;
            if (err !== undefined) {
                console.log('err ' + err);
            }
            //if (DEBUG) {
            //    console.log('results ' + results);
            //}
        });
    }, 50); */

// search for next address with a DCC packet in it
function findNextSlot(slottype, lastCount) {
    if (slottype.length === 0) { // not a single entry in dccS[] array
        return undefined;
    }
    var count = lastCount + 1;
    while ((slottype[count] === undefined) && (count < slottype.length)) {
        count++;
    }
    if (count === slottype.length) {
        // restart with first address
        //console.log("restart");
        lastCount = 1;
        count = 1;
        while ((slottype[count] === undefined) && (count < slottype.length)) {
            count++;
        }
        if (count === slottype.length) {
            return undefined; // not a single entry in dccS[] array
        }
    }
    //if (DEBUG_SEND) {
    //    console.log("lastCount=" + lastCount + " found=" + count);
    //}
    return count;

}

// regularly called timer function to handle the serial port
// output to SPROG
function timer() {
    var addr;
    
    if (DEBUG_SEND) {
        var d = new Date();
        var ms = d.getTime();
        console.log(statusCount + " - " + d.getUTCSeconds()+":"+d.getUTCMilliseconds());
    }
    if (status === WAITING) { //cannot send anything
       if (DEBUG) {
           console.log("waiting");
       }
       return;
    }
    statusCount++;
    if (immediateCmd !== undefined) {
        sendString(immediateCmd);
        if (DEBUG_SEND) {
            console.log("writing immediateCmd to sprog:" + immediateCmd);
        }
        immediateCmd = undefined; // reset, sent only once
    } else if ((statusCount % 10) === 0) {   // refresh functions less frequently
        addr = findNextSlot(func04,lastF04); // advance to next slot
        if (addr !== undefined) {
            lastF04 = addr;
            if (DEBUG_SEND) {
                console.log("DCC-F04-pkt for addr=" + addr + " toSPROG=" + func04[addr]);
            }
            sendString(func04[addr]);
        }
     }  else if ((statusCount % 10) === 2) {   // refresh functions less frequently
        addr = findNextSlot(func58,lastF58); // advance to next slot
        if (addr !== undefined) {
            lastF58 = addr;
            if (DEBUG_SEND) {
                console.log("DCC-F58-pkt for addr=" + addr + " toSPROG=" + func58[addr]);
            }
            sendString(func58[addr]);
        }
     } else if ((statusCount % 10) === 4) {   // refresh functions less frequently
        addr = findNextSlot(func912,lastF912); // advance to next slot
        if (addr !== undefined) {
            lastF912 = addr;
            if (DEBUG_SEND) {
                console.log("DCC-F912pkt for addr=" + addr + " toSPROG=" + func912[addr]);
            }
            sendString(func912[addr]);
        }
     } else if (statusCount > 200) { // request status from SPROG from time to time
        statusCount = 0;
        sendString("S");
        if (DEBUG_SEND) {
            console.log("requesting status");
        }
        
    } else {
        addr = findNextSlot(dccS, lastLoco); // advance to next slot
        if (addr !== undefined) {
            lastLoco = addr;
            if (DEBUG_SEND) {
                console.log("DCC-Loc-pkt for addr=" + addr + " toSPROG=" + dccS[addr]);
            }
            sendString(dccS[addr]);
        }

    }
}

exports.dccLoco128 = function (addr, lspeed, ldir) {
    dccS[addr] = "O " + packet.speed128(addr, lspeed, ldir);
};

exports.dccFunctions0to4 = function (addr, fun) {
    func04[addr] = "O " + packet.functions0to4(addr, fun[0], fun[1], fun[2], fun[3], fun[4]);
};

exports.dccFunctions5to8 = function (addr, fun) {
    func58[addr] = "O " + packet.functions5to8(addr, fun[5], fun[6], fun[7], fun[8]);
};

exports.dccFunctions9to12 = function (addr, fun) {
    func912[addr] = "O " + packet.functions9to12(addr, fun[9], fun[10], fun[11], fun[12]);
};


exports.dccPower = function (power_on) {
    if (power_on == 1) {
        immediateCmd = "+";
        console.log("POWER ON");
    } else {
        immediateCmd = "-";
        console.log("POWER OFF");
    }
}


if (SIMULATION) {
    setInterval(timer, 1000); // to able to follow in terminal window
} else {
    setInterval(timer, 20); // with a timer setting of 10ms, every second 
    // call to the timer hits the "WAITING" state, therefor set to >=10ms
}
