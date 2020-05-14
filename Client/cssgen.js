var obj = {
    seat0: {
        top: 500,
        left: 150
    },
    
    seat1: {
        top: 250,
        left: 5
    },
    
    seat2: {
        top: 10,
        left: 150
    },
    
    seat3: {
        top: 10,
        left: 380
    },
    
    seat4: {
        top: 10,
        left: 610
    },
    
    seat5: {
        top: 10,
        left: 840
    },
    
    seat6: {
        top: 210,
        left: 1050
    },
    
    seat7: {
        top: 500,
        left: 840
    },
    
    seat8: {
        top: 500,
        left: 610
    },
    
    seat9: {
        top: 500,
        left: 380
    },
    
    board: {
        top: 220,
        left: 340
    }
};

var max = 1200;
var min = 600;

var top_scale = 0.94;
var left_scale = 0.94;

var keys = Object.keys(obj);
var s = "";
for (var x=max-50; x>min; x=x-50) {
    s += `@media (max-width: ${x}px) {\n`;
    for(var y=0; y<keys.length; y++) {
        var cur = obj[keys[y]];
        cur.top = Math.round(cur.top * top_scale);
        cur.left = Math.round(cur.left * left_scale);

        cur.scale = 1;
        if(x < 950) {
            cur.scale = .8;
        }
        else if(x < 1050) {
            cur.scale = .9;
        }
        s += `#${keys[y]} { top: ${cur.top}px; left: ${cur.left}px; }\n`;
    }
    s += '}\n\n';
}

console.log(s);