'use strict';

var http = require('request');
var express = require('express');
var app = express();
var crypto = require('crypto');
var fs = require('fs');
var imageType = require('image-type');

function getFile(url, callback) {
    var cacheDir = __dirname + "/cache/",
        md5sum = crypto.createHash('md5'),
        savePath = cacheDir + md5sum.update(url).digest('hex'),
        statusCode,
        headers,
        invalidImage = false;

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

    function showDummyImage() {
        statusCode = 400;
        headers = {};

        fs.unlink(savePath, function () {
            console.log("removed invalid image: " + savePath);
        });

        callback(
            '',
            new Buffer('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64'),
            statusCode,
            headers
        );
    }

    function downloadFile() {
        var validImage = false;
        var fileStream = fs.createWriteStream(savePath),
            request = http(url,
                function (error) {
                    if (error) {
                        invalidImage = true;
                        console.log(error);
                        showDummyImage();
                    }
                });

        request
            .on('data', function (data) {
                if (!imageType(data) && validImage === false) {
                    invalidImage = true;
                    console.log('Url is no image: ' + url);
                    request.abort();
                    showDummyImage();
                } else {
                    validImage = true;
                }
            })
            .on('response', function (response) {
                statusCode = response.statusCode;
                headers = response.headers;
            })
            .pipe(fileStream);

        fileStream.on('close', function () {
            if (!invalidImage) {
                readFile();
            }
        });
    }

    if (url) {
        fs.exists(savePath, function (exists) {
            if (exists) {
                readFile();
            } else {
                downloadFile();
            }
        });
    } else {
        showDummyImage();
    }
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
