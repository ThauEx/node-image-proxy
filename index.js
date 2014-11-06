var http = require('needle')
var express = require('express')
var app = express()
var crypto = require('crypto');
var fs = require('fs');

app.use('/', function (req, res) {
    var URL = req.url.substr(1);

    getFile(URL, function(err, data) {
/*            res.writeHead(200, {
                'Content-Type': 'image/png'
            });
*/
//            res.write(data);
            res.end(data, 'binary');
    });
})

function getFile(url, callback) {
    var cacheDir = __dirname + "/cache/";
    var md5sum = crypto.createHash('md5');
    var savePath = cacheDir + md5sum.update(url).digest('hex');

    fs.exists(savePath, function(exists) {
        if (exists) {
            fileFetch();
        } else {
            fetch();
        }
    });

    function fileFetch() {
        fs.readFile(savePath, function(err, imagedata) {
            if (err) {
                throw err
            };
            callback(err, imagedata);

            fs.stat(savePath, function(err, stats) {
                var date = new Date();
                date.setMonth(date.getDay() - 1);

                if (stats.mtime < date) {
                    fs.unlink(savePath, function() {
                        console.log("removed old image: " + savePath);
                    })
                }
            })
        });
    }

    function fetch() {
        var out = fs.createWriteStream(savePath);
        http.get(url).pipe(out);
        fileFetch();
        /*http.get(url, function(error, res) {
            if (!error && res.statusCode < 400) {
                var imagedata = '';
                res.setEncoding('binary');

                res.on('readable', function(chunk) {
                    imagedata += chunk;
                });

                res.on('end', function() {
                    writeImage(imagedata);
                });
            }
        });*/
    }

    function writeImage(imagedata) {
        fs.writeFile(savePath, imagedata, 'binary', function(err) {
            if (err) {
                throw err
            };
            fileFetch();
        });
    }
}
var server = app.listen(9091, function () {
    var host = server.address().address
    var port = server.address().port

    console.log('app listening at http://%s:%s', host, port)
});
