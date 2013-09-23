var connect = require('connect');
var web_root = __dirname + "/web";

connect.createServer( connect.static(web_root) ).listen(3000);