let zlib = require('zlib');
fs = require('fs');
class RequestTracker {

    track(req) {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        })
        req.on('end', () => {
            req.body = data;
        })

    }

    response(req, res) {
        this.getGzipped(res, (body) => {

            res.body = body;
            // fs.appendFile('test.txt', this.formatData(req, res), e => { if (e) console.log(e) });
            console.log(this.formatData(req, res));
        });
    }

    getGzipped(res, callback) {
        // buffer to store the streamed decompression
        var buffer = [];
        // pipe the response into the gunzip to decompress
        var gunzip = zlib.createGunzip();
        res.pipe(gunzip);

        gunzip.on('data', function (data) {
            // decompression chunk ready, add it to the buffer
            buffer.push(data.toString())

        }).on("finish", function () {
            // response and decompression complete, join the buffer and return
            callback(buffer.join(""));

        }).on("error", function (e) {
            callback(buffer.join(""));
        });
    }
    formatData(req, res) {
        let formatedData = [];
        formatedData.push('------------------------------------------');
        formatedData.push('---- Request --');
        formatedData.push(`- Method \t${req.method}`);
        formatedData.push(`- Url \t${req.url}`);
        if (req.body) {
            formatedData.push(`- Body \t${JSON.stringify(JSON.parse(req.body), null, 4)}`);
        }
        formatedData.push(`---- Response --`);
        if (res.body) {
            formatedData.push(`- Body \t${JSON.stringify(JSON.parse(res.body), null, 4)}`);
        }
        formatedData.push('------------------------------------------');
        return formatedData.join('\r\n');
    }
}
module.exports = new RequestTracker();