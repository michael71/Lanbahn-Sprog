// test speed

/*jslint node: true */
/*jslint plusplus: true */
"use strict";

var sprog = require('./sprogDcc.js');


console.log("211, s=0, dir=0   / SPROG = " + sprog.speed128(211, 0, 0));
console.log("211, s=0, dir=1   / SPROG = " + sprog.speed128(211, 0, 1));

console.log("211, s=127, dir=0 / SPROG = " + sprog.speed128(211, 127, 0));

console.log("211 F0 and F1 on  / SPROG = " + sprog.functions0to4(211, 1, 1, 0, 0, 0));