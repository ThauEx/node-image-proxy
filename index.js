'use strict';

var http = require('request');
var express = require('express');
var app = express();
var crypto = require('crypto');
var fs = require('fs');

function getFile(url, callback) {
    var cacheDir = __dirname + "/cache/",
        md5sum = crypto.createHash('md5'),
        savePath = cacheDir + md5sum.update(url).digest('hex'),
        statusCode,
        headers;

    function readFile() {
        fs.readFile(savePath, function (error, imagedata) {
            if (error) {
                throw error;
            }

            statusCode = 200;
            headers = {};

            callback(error, imagedata, statusCode, headers);

            fs.stat(savePath, function (error, stats) {
                if (error) {
                    throw error;
                }

                var date = new Date();
                date.setMonth(date.getMonth(), date.getDay() - 1);

                if (stats.mtime < date) {
                    fs.unlink(savePath, function () {
                        console.log("removed old image: " + savePath);
                    });
                }
            });
        });
    }

    function downloadFile() {
        var fileStream = fs.createWriteStream(savePath);

        fileStream.on('close', function () {
            readFile();
        });

        http(url)
            .on('response', function (response) {
                statusCode = response.statusCode;
                headers = response.headers;
            })
            .pipe(fileStream);
    }

    fs.exists(savePath, function (exists) {
        if (exists) {
            readFile();
        } else {
            downloadFile();
        }
    });
}

app.set('port', process.env.PORT || 9091);
var server = app.listen(app.get('port'), function () {
    var host = server.address().address,
        port = server.address().port;

    console.log('app listening at http://%s:%s', host, port);
});


app.use('/', function (req, res) {
    var URL = req.url.substr(1);

    getFile(URL, function (error, data, statusCode, headers) {
        if (error) {
            throw error;
        }

        res.writeHead(statusCode, headers);
        res.end(data, 'binary');
    });
});
