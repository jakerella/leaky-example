/**
 * This script helps to artifically generate load on a web application through
 * weighted requests to various endpoints. It may not be pretty, but it works 
 * for me. :) Feel free to use however you want.
 * 
 * NOTE: Please use responsibly, don't run this script against a production server!
 * 
 * @author Jordan Kasper (@jakerella)
 * @license MIT
 */

var http = require('http');

var config = {
    suppressConsole: false,
    
    // Options passed directly into the http.request(...) method on each request
    httpOptions: {
        host: 'localhost',
        port: 3001,
        headers: {
            'Content-Type': 'application/json'
        }
    },
    // Use the array below to specify requests to send to the application
    // Note that the "weights" should add up to 1.0, but will be approximated
    requests: [
        { path: '/widget', method: 'POST', weight: 0.80 },
        { path: '/widget?count=10000', method: 'POST', weight: 0.20 }
    ],
    responseEncoding: 'utf8',
    stopOnReqError: false, // If true, stops the Node process on request errors (NOT http status codes)
    logHTTPErrors: false,  // Logs any 400+ status code... can be chatty
    stopOn400: false,      // Forces an exit on the Node process on 4XX errors
    stopOn500: true,       // Forces an exit on the Node process on 5XX errors
    requestsPerSecond: 5,
    trafficSpikeFreq: [3000, 5000],
    trafficSpikeAmplitude: [50, 100],
    
    // The items below are used internally and may be overridden, don't use them!
    maxWeight: 100,
    weighted: [],
    waitTime: 1000
};

function start(options) {
    var spikeTimeout = getSpikeTimeout(),
        maxWeight = (config.requests.length > 10 && 100) || config.maxWeight || 10;
    
    options = options || {};
    
    if (options.port) {
        config.httpOptions.port = options.port;
    }
    config.suppressConsole = !!options.suppressConsole;
    
    config.requests.forEach(function(request, reqIndex) {
        for (var i=0; i < (request.weight || 0.1) * maxWeight; ++i) {
            config.weighted.push(reqIndex);
        }
    });
    
    config.waitTime = 1000 / config.requestsPerSecond
    
    log('Beginning load generation at 1 req per ' + config.waitTime + 'ms.');
    log('Using weighted requests:\n' + config.weighted);
    log('Press "Ctrl + C" to stop.\n');
    
    sendNext();
    
    if (spikeTimeout) {
        setTimeout(sendSpike, spikeTimeout);
    }
}

function log(m) {
    if (!config.suppressConsole) {
        console.log(m);
    }
}


function sendNext() {
    var nextIndex = config.weighted[ Math.floor(Math.random() * config.weighted.length) ],
        request = config.requests[ nextIndex ];
    
    sendRequest(request.method, request.path, request.data, function(err, res) {
        if (err) {
            log(err);
        }
    });
    
    setTimeout(sendNext, config.waitTime);
}


function sendSpike() {
    var i, nextIndex, request,
        numRequests = 0,
        nextSpike = getSpikeTimeout();
    
    if (typeof config.trafficSpikeAmplitude === 'number') {
        
        numRequests = config.trafficSpikeAmplitude;
        
    } else {
        
        numRequests = Math.floor(
            (Math.random() * (config.trafficSpikeAmplitude[1] - config.trafficSpikeAmplitude[0])) +
            config.trafficSpikeAmplitude[0]
        );
        
    }
    
    log('Sending traffic spike with ' + numRequests + ' requests...');
    
    for (i=0; i<numRequests; ++i) {
        nextIndex = config.weighted[ Math.floor(Math.random() * config.weighted.length) ];
        request = config.requests[ nextIndex ];
        
        if (request.ignoreSpikes) {
            i--;
            continue;
        }
        
        sendRequest(request.method, request.path, request.data);
    }
    
    if (nextSpike) {
        setTimeout(sendSpike, nextSpike);
    }
}


function sendRequest(method, path, data, cb) {
    var options = config.httpOptions || {};
    options.path = path || '/';
    options.method = method || 'GET';
    options.headers = options.headers || {};
    options.headers['Content-Length'] = (data && data.length) || 0;
    
    var req = http.request(options, function(res) {
        var err = null,
            body = '';
        
        res.setEncoding(config.responseEncoding);
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            res.body = body;
            
            if (res.statusCode > 399) {
                err = new Error(body);
                err.status = err.code = res.statusCode;
                
                if (config.logHTTPErrors) {
                    log('Server returned error from ', options.method + ' ' + options.path, res.statusCode);
                }
                
                if (res.statusCode > 499 && config.stopOn500) {
                    process.exit(1);
                } else if (res.statusCode > 399 && config.stopOn400) {
                    process.exit(1);
                }
            }
            
            cb && cb(err, res);
        });
    });
    
    req.on('error', function(err) {
        log('Error with request:', err.message);
        if (config.stopOnReqError) {
            process.exit(1);
        } else {
            cb && cb(err);
        }
    });
    
    if (data) {
        req.write(data);
    }
    req.end();
}

function getSpikeTimeout() {
    if (typeof config.trafficSpikeFreq === 'number') {
        
        return config.trafficSpikeFreq;
        
    } else if (config.trafficSpikeFreq && config.trafficSpikeFreq.splice && config.trafficSpikeFreq.length === 2) {
    
        return Math.floor(
            (Math.random() * (config.trafficSpikeFreq[1] - config.trafficSpikeFreq[0])) +
            config.trafficSpikeFreq[0]
        );
    } else {
        return null;
    }
}


if (require.main === module) {
    start();
} else {
    module.exports = start;
}
