// test speed28

/*jslint node: true */
/*jslint plusplus: true */
"use strict";

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

var i;
for (i = 0; i <= 28; i++) {
    console.log("s=" + i + " " + speed28(i).toString(2));
}