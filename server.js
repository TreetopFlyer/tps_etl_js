require('dotenv').config();
var express = require('express');
var handlebars = require('express-handlebars');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mult = require('multer');
var upload = mult({ encoding: "utf8" });
var csvtojson = require('csvtojson');
var pg = require('pg');

var server = express();
server.engine('handlebars', handlebars());
server.set('view engine', 'handlebars');

server.use(function(inReq, inRes, inNext)
{
    inRes.header("Access-Control-Allow-Origin", "*");
    inRes.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
    inRes.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    inNext();
});


var Postgres = new pg.Client({
    user: process.env.user,
    password: process.env.password,
    host: process.env.host,
    port: process.env.port,
    database: process.env.database,
    ssl: true,
    application_name: "tps_etl_api"
});
Postgres.FirstRow = function(inSQL,args, inResponse)
{
    Postgres.query(inSQL,args, (err, res) => {
        if (err === null)
        {
            inResponse.json(res.rows[0]);
            return;
        }
        inResponse.json(err.message);
    });
};
Postgres.connect();

//----------------------------------------------------------source definitions------------------------------------------------------------

//returns array of all sources
server.get("/source", function (inReq, inRes)
{
    var sql = "SELECT jsonb_agg(defn) source_list FROM tps.srce";
    Postgres.FirstRow(sql,[], inRes);
});
//returns message about status and error description
server.post("/source", bodyParser.json(), function (inReq, inRes)// remove body parsing, just pass post body to the sql string build
{
    var sql = "SELECT x.message FROM tps.srce_set($1::jsonb) as x(message)";
    Postgres.FirstRow(sql,[JSON.stringify(inReq.body)], inRes);
});

//----------------------------------------------------------regex instractions--------------------------------------------------------------------------
//list all regex operations
server.get("/regex", function (inReq, inRes)
{
    var sql = "SELECT jsonb_agg(regex) regex FROM tps.map_rm";
    Postgres.FirstRow(sql, [], inRes);
});

//set one or more map definitions
server.post("/regex", bodyParser.json(), function (inReq, inRes)
{
    var sql = "SELECT x.message FROM tps.srce_map_def_set($1::jsonb) as x(message)";
    Postgres.FirstRow(sql, [JSON.stringify(inReq.body)], inRes);
});

//------------------------------------------------------------mappings-------------------------------------------------------------------------------

//list unmapped items flagged to be mapped   ?srce=
server.get("/unmapped", function (inReq, inRes)
{
    var sql = "SELECT jsonb_agg(row_to_json(x)::jsonb) regex FROM tps.report_unmapped_recs($1::text) x";
    Postgres.FirstRow(sql,[inReq.query.srce], inRes);
});

//add entries to lookup table
server.post("/mapping", bodyParser.json(), function (inReq, inRes)
{
    var sql = "SELECT x.message FROM tps.map_rv_set($1::jsonb) as x(message)";
    Postgres.FirstRow(sql,[JSON.stringify( inReq.body)], inRes);
});


//-------------------------------------------------------------import data--------------------------------------------------------------------------

server.use("/import", upload.single('upload'), function (inReq, inRes) {

    console.log("should have gotten file as post body here");
    var csv = inReq.file.buffer.toString('utf8')
    //{headers: "true", delimiter: ",", output: "jsonObj", flatKeys: "true"}
    csvtojson({ flatKeys: "true" }).fromString(csv).then(
        (x) => {
            var sql = "SELECT x.message FROM tps.srce_import($1, $2::jsonb) as x(message)"
            console.log(sql);
            Postgres.FirstRow(sql, [inReq.query.srce, JSON.stringify(x)], inRes);
        }
    );
    }
);

//-------------------------------------------------------------suggest source def--------------------------------------------------------------------------

server.use("/csv_suggest", upload.single('upload'), function (inReq, inRes) {

    console.log("should have gotten file as post body here");
    var csv = inReq.file.buffer.toString('utf8')
    //{headers: "true", delimiter: ",", output: "jsonObj", flatKeys: "true"}
    csvtojson({ flatKeys: "true" }).fromString(csv).then(
        (x) => {
            var sug = {
                schemas: {
                    default: []
                },
                loading_function: "csv",
                source:"client_file",
                name: "",
                constraint: []
            };
            for (var key in x[0]) {
                var col = {};
                //test if number
                if (!isNaN(parseFloat(x[0][key])) && isFinite(x[0][key])) {
                    //if is a number but leading character is -0- then it's text
                    if (x[0][key].charAt(0) == "0"){
                        col["type"] = "text";
                    }
                    //if number and leadign character is not 0 then numeric
                    else {
                        col["type"] = "numeric";
                    }
                } 
                //if can cast to a date within a hundred years its probably a date
                else if (Date.parse(x[0][key]) > Date.parse('1950-01-01') && Date.parse(x[0][key]) < Date.parse('2050-01-01')) {
                    col["type"] = "date";
                }
                //otherwise its text
                else {
                    col["type"] = "text";
                }
                col["path"] = "{" + key + "}";
                col["column_name"] = key;
                sug.schemas.default.push(col);
            }
            console.log(sug);
            inRes.json(sug);
        }
    );
    }
);


server.get("/", function (inReq, inRes)
{
    inRes.render("definition", { title: "definition", layout: "main" });
});

module.exports = server;