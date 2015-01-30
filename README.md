Lanbahn-Sprog
=============

<h3>This is BETA software currently!</h3>

<p>Lanbahn software for controlling Locos with SPROG </p>
<p> - see http://www.lanbahn.net/sprog-raspberrypi </p>

<h2>Installation:</h2>
<pre>1) copy all files in a directory
2) install nodejs 
   (installation on raspberryPI:  
        wget http://node-arm.herokuapp.com/node_latest_armhf.deb
        sudo dpkg -i node_latest_armhf.deb   )
3) install the node modules "dateformat" and "serialport"
4) change settings (sprog serial port) in sprogDevice.js
5) start program with: <i>node lanbahn2sprog.js</i>
</pre>

<h2>Pre-Requisites</h2>
<pre>1) SPROG, see http://www.sprog-dcc.co.uk/
2) a throttle to send the lanbahn UDP commands
(like LanbahnThrottle for Android, see http://www.lanbahn.net)
</pre>

<h2>How it works</h2>
<p>After starting the software with "node lanbahn2sprog.js" a UDP multicast client 
is listening to UDP messages on the LANBAHN port 27027 and LANBAHN multicast group. 
When the client receives a "LOCO" message with a valid loco address and valid data 
like "LOCO 211 50 1 1 0 0 0 0" (=Loco address 211, speed 50, forward, F0 on, other
functions off), the program will start generating DCC packets and send them to SPROG
via USB . </p>
<p>Understands only "LOCO" and "POWER" commands so far and only sends DCC packets with 128 speed steps and Functions F0 ... F12.</p>
