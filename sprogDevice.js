// sprog_device.js

// handles sending of packages via SPROG II v3 or SPROG3
// 
/*jslint node: true */
/*jslint plusplus: true */
/*jslint bitwise: true */
"use strict";

var DEBUG = true;
var SIMULATION = false;

var SPROG = "/dev/ttyACM0"; // sprog serial port
var serialport = require("serialport");
var SerialPort = serialport.SerialPort;

var packet = require('./sprogDccPacket.js');

// arrays for dcc packets (index = loco address)
var dccS = [];
var func0 = []; // same for function data
var func1 = [];
var immediateCmd;
var statusCount = 170;

// for "slot" machine
var lastLoco = 0;
var lastf04 = 0;

var IDLE = 0;
var WAITING = 1;
var status = IDLE; // status of the serial port "handshake" between
// this program and the SPROG

var serialPort = new SerialPort(SPROG, {
    baudrate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    flowControl: false,
    parser: serialport.parsers.readline(">") // sprog terminates messages with CR (not LF !)
});

serialPort.on("open", function () {
    console.log('open');

    serialPort.on('data', function (data) {
        //result = data.trim();
        console.log('serial received: ' + data); //result);
        if (data.indexOf("S") > -1) {
            console.log('status message');
            var i = data.indexOf('h');
            if (i > -1) {
                var current = (parseInt(data.substring(i + 7, i + 11), 16) * 488) / 47;
                console.log("I[mA] = " + Math.round(current));
            }
        }
        status = IDLE;
        /* from JMRI
        int i = s.indexOf('h');
         //Check that we got a status message before acting on it
         //by checking that "h" was found in the reply
         if (i > -1) {
           int milliAmps = ((Integer.decode("0x" + s.substring(i + 7, i + 11)).intValue()) * 488) / 47;
           statusA[0] = milliAmps;
           String ampString;
           ampString = Float.toString((float) statusA[0] / 1000);
           SprogSlotMonFrame.instance().updateStatus(ampString);
         }
         */

    });

    setTimeout(function () {
        console.log("waiting...");
        var command = '\r';
        serialPort.write(command, function (err, results) {
            status = WAITING;
            if (err !== undefined) {
                console.log('err ' + err);
            }
            console.log('results ' + results);
        });
    }, 10);

    serialPort.on('error', function (err) {
        console.error("serial error", err);
    });
});

function sendString(s) {
    if (!SIMULATION) {
        serialPort.write(s + "\r", function (err, results) {
            status = WAITING;
            if (err !== undefined) {
                console.log('serial err ' + err);
            }
        });
    }
}

function findNextLocoSlot() {
    if (dccS.length === 0) { // not a single entry in dccS[] array
        return undefined;
    }
    var count = lastLoco + 1;
    while ((dccS[count] === undefined) && (count < dccS.length)) {
        count++;
    }
    if (count === dccS.length) {
        // restart with first address
        console.log("restart");
        lastLoco = 1;
        count = 1;
        while ((dccS[count] === undefined) && (count < dccS.length)) {
            count++;
        }
        if (count === dccS.length) {
            return undefined; // not a single entry in dccS[] array
        }
    }
    console.log("lastLoco=" + lastLoco + " found=" + count);
    return count;

}

// regularly called timer function to handle the serial port
// output to SPROG
function timer() {
    var addr;

    console.log(Date().substring(16, 24));
    if (status === WAITING) { //cannot send anything
        console.log("waiting");
        return;
    }
    statusCount++;
    if (immediateCmd != undefined) {
        sendString(immediateCmd);
        console.log("writing immediateCmd to sprog:" + immediateCmd);
        immediateCmd = undefined; // reset, sent only once
    } else if (statusCount > 200) { // request status from SPROG from time to time
        statusCount = 0;
        sendString("S");
        console.log("requesting status");
    } else {
        addr = findNextLocoSlot(); // advance to next slot
        if (addr !== undefined) {
            lastLoco = addr;
            console.log("DCC-pkt for addr=" + addr + " toSPROG=" + dccS[addr]);
            sendString(dccS[addr]);
        }

    }
}

exports.dccLoco128 = function (addr, lspeed, ldir) {
    dccS[addr] = "O " + packet.speed128(addr, lspeed, ldir);
};

exports.dccFunctions0to4 = function (addr, fun) {
    func0[addr] = "O " + packet.functions0to4(addr, fun[0], fun[1], fun[2], fun[3], fun[4]);
};

exports.dccFunctions5to9 = function (addr, fun) {
    func1[addr] = "O " + packet.functions5to9(addr, fun[5], fun[6], fun[7], fun[8], fun[9]);
};

exports.dccPower = function (power_on) {
    if (power_on == 1) {
        immediateCmd = "+";
    } else {
        immediateCmd = "-";
    }
}


if (SIMULATION) {
    setInterval(timer, 1000); // to able to follow in terminal window
} else {
    setInterval(timer, 20); // with a timer setting of 5ms, every second 
    // call to the timer hits the "WAITING" state, therefor set to >=10ms
}