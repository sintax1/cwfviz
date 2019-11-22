var express = require("express");
var r=require("request");
var txUrl = "http://" + process.env.NEO4J_HOST + ":" + process.env.NEO4J_HTTP_PORT + "/db/data/transaction/commit";

var app = express();
var auth = "Basic " + new Buffer.from(process.env.NEO4J_USER + ":" + process.env.NEO4J_PASS).toString("base64");

function cypher(query, params, cb) {
    r.post({
        uri:txUrl,
        headers : {
            "Authorization" : auth
        },
        json:{
            statements:[
                {
                statement: query,
                parameters: params
                }
            ]}
        },
        function(err, res) {
            if (err) {
                console.error(err);
                cb(err, null);
            } else {
                cb(err, res.body);
            }
        }
    )
}

app.use(express.static('public'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/js', express.static(__dirname + '/public/js'));

app.get('/wr-paths', function (req, res) {
    // The Cypher query used to gather the workrole relationships. Filtering out the 6 KSAs that are common across all 52 WRs.
    var query = `MATCH (c:NICECategory)--(sa:NICESpecialtyArea)--(w1:NICEWorkrole)<-[:NICE_WORKROLE]-(k:KSAT)-[:NICE_WORKROLE]->(w2:NICEWorkrole)
    WHERE NOT k.id IN ['K0001', 'K0002', 'K0003', 'K0004', 'K0005', 'K0006']
    RETURN c.id, sa.id, w1.title, collect(w2.title) ORDER BY c.id`
    var params={}
    var cb=function(err, data) {
        if (err) {
            res.status(500).send(err);
        } else {
            data = data['results'][0]['data'].map(x => {
                return({
                    category: x['row'][0],
                    specialtyarea: x['row'][1],
                    title: x['row'][2],
                    related: x['row'][3]
                });
            });

            if (process.env.DEBUG) {
                console.debug(JSON.stringify(data));
            }
            res.send(data);
        }
    }

    cypher(query, params, cb);
});  

var server = app.listen(8080, '0.0.0.0', function(){
    var port = server.address().port;
    console.log("Server started at http://localhost:%s", port);
});
