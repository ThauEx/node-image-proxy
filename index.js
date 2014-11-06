var http = require('needle')
var express = require('express')
var app = express()
var crypto = require('crypto');
var fs = require('fs');

app.use('/', function (req, res) {
    var URL = req.url.substr(1);

    getFile(URL, function(err, data) {
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
        http.get(url, function(error, response) {
            fileFetch();
        }).pipe(out);
    }
}

app.set('port', process.env.PORT || 9091);
var server = app.listen(app.get('port'), function () {
    var host = server.address().address
    var port = server.address().port

    console.log('app listening at http://%s:%s', host, port)
});
