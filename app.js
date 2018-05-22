const fs = require('fs');
const http = require('http');

http.createServer(function(req, res){
    res.writeHead(200, {'Content-Type': 'text/html'});
    var readStream = fs.createReadStream('startpage.html', 'utf8');
    readStream.pipe(res);
}).listen(3000);

console.log("server is running on http://127.0.0.1:3000/");