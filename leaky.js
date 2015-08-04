var app = require('express')(),
    http = require('http');

// ------- Our Leaky Class... ------- //

var widgets = [];
function Widget() {}

// ------- Our Routes ------- //

app.get('/', function(req, res) {
    res.json({ msg: 'Leaky App running', count: widgets.length });
});

app.post('/widget', function(req, res) {
    var count = (req.query.count || 10);
    
    for (var i = 0; i < count; i++) {
        widgets.push(new Widget());
    }
    
    res.json({ count: widgets.length });
});


// ------- Start it up ------- //

var port = process.env.PORT || 3000;

app.listen(port, function() {
    console.log('Leaky app listening on', port);
    
    console.log('Starting load generation...');
    require('./generate-load')({
        port : port,
        suppressConsole: true
    });
    
    console.log('\nMemory Usage (1s interval, in MB)');
    var label = '----15---30---45---60---75---90-------120-------150-------180-------210-------240-------270-------300';
    var labelTick = 0;
    console.log(label);
    setInterval(function printMemoryUsage() {
        var memMB = process.memoryUsage().rss / 1048576;
        var chartPoint = '';
        
        for (var i=0, l=Math.round(memMB); i<l; i+=3) {
            chartPoint += '-';
        }
        console.log(chartPoint);
        
        if (labelTick > 20) {
            console.log(label);
            labelTick = 0;
        }
        
        labelTick++;
    }, 1000);
});