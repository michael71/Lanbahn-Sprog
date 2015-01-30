// lanbahn2sprog.js

//TODO receive lanbahn LOCO and LOCOFUN command and 
//     send to SPROG.


// abbreviations lb=lanbahn

/*jslint node: true */
/*jslint plusplus: true */
/*jslint bitwise: true */
"use strict";

// constants

var DEBUG = false;

var LB_PORT = 27027; // lanbahn port
var LB_GROUP = '239.200.201.250'; // lanbahn multicast group (=address)


var dgram = require('dgram');
var client = dgram.createSocket('udp4');
var dateFormat = require('dateformat');

var sprogDevice = require('./sprogDevice.js');

/* examples:
console.log("211, s=0, dir=0   / SPROG = " + sprog.speed128(211, 0, 0));
console.log("211, s=0, dir=1   / SPROG = " + sprog.speed128(211, 0, 1));
console.log("211, s=127, dir=0 / SPROG = " + sprog.speed128(211, 127, 0));
console.log("211 F0 and F1 on  / SPROG = " + sprog.functions0to4(211, 1, 1, 0, 0, 0));  */


function isInteger(value) {
    // see http://stackoverflow.com/questions/14636536/
    //       how-to-check-if-a-variable-is-an-integer-in-javascript
    if (isNaN(value)) {
        return false;
    }
    var x = parseFloat(value);
    return (x | 0) === x;
}



function locoSlot(element, index, array) {
    console.log('a[' + index + '] = ' + element);
}



// set client to listen to Lanbahn Multicast Group
client.on('listening', function () {
    var address, dateshort;
    address = client.address();
    // log start message
    dateshort = dateFormat(Date(), "yyyy-mm-dd h:MM:ss ");
    console.log(dateshort + ';lanbahn2spark.js started');
    console.log(dateshort + ';UDP Client listening on ' +
                 LB_GROUP + ":" + LB_PORT);
    client.setBroadcast(true);
    client.addMembership(LB_GROUP);
});

// this function is called every time a message is received via UDP
client.on('message', function (message, remote) {
    var str, cmd, t, sprogCmd, i, addr, lspeed, ldir;
    str = message.toString().replace(/\s+/g, ' ').toUpperCase().trim();
    cmd = str.split(' ');
    if (cmd.length < 2) {
        return;
    }
    if ((cmd[0] === 'POWER') && (isInteger(cmd[1]))) {
        // power on off command
        if (DEBUG) {
            console.log("cmd: " + str);
        }
        sprogDevice.dccPower(cmd[1]);
    } else if ((cmd[0] === 'LOCO') && (cmd.length >= 3) && (isInteger(cmd[1])) && (isInteger(cmd[2])) && (isInteger(cmd[3])) && (cmd[1] > 0) && (cmd[1] <= 10000)) {
        // a UDP "LOCO" command is received and checked for validity
        if (DEBUG) {
            console.log("cmd: " + str);
        }
        addr = cmd[1];
        // speed is normalized to 0 .. 100, DCC: 0..127
        if (cmd[2] < 0) {
            lspeed = 0;
        } else if (cmd[2] > 100) {
            lspeed = 100;
        } else {
            lspeed = Math.floor((cmd[2] * 127) / 100);
        }
        ldir = (cmd[3] == 1)? 1 : 0;
        sprogDevice.dccLoco128(addr, lspeed, ldir);
       
        var fun = [];
        // first DCC function block
        for (i = 0; i < 5; i++) {
            var val = parseInt(cmd[i + 4]);
            if (val === undefined) {
                val = 0;
            }
            fun[i] = val;
        }; // store the data to send them later to sprog
        sprogDevice.dccFunctions0to4(addr, fun);
        
        // second DCC function block (if contained in lanbahn string)
        if (cmd.length >= 8) {
            for (i = 5; i < 9; i++) {
                var val = parseInt(cmd[i + 4]);
                if (val === undefined) {
                    val = 0;
                }
                fun[i] = val;
            }; // store the data to send them later to sprog
            sprogDevice.dccFunctions5to8(addr, fun);
        }   
        
        // second DCC function block (if contained in lanbahn string)
        if (cmd.length >= 12) {
            for (i = 9; i < 13; i++) {
                var val = parseInt(cmd[i + 4]);
                if (val === undefined) {
                    val = 0;
                }
                fun[i] = val;
            }; // store the data to send them later to sprog
            sprogDevice.dccFunctions9to12(addr, fun);
        }   


    } else { // unknown command
        if (DEBUG) {
            console.log("???: " + str);
        }
    }
});

client.bind(LB_PORT);
