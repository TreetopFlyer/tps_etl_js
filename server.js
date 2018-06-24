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
    application_name: "tps_etl_api",
    ssl: true
});
Postgres.FirstRow = function(inSQL, inResponse)
{
    Postgres.query(inSQL, (err, res) => {
        if (err === null)
        {
            inResponse.json(res.rows[0]);
            return;
        }
        inResponse.json(err.message);
    });
};
Postgres.connect();


server.get("/source", function (inReq, inRes)
{
    var sql = "SELECT jsonb_agg(defn) source_list FROM tps.srce";
    Postgres.FirstRow(sql, inRes);
});
server.post("/source", bodyParser.json(), function (inReq, inRes)// remove body parsing, just pass post body to the sql string build
{
    var sql = "SELECT x.message FROM tps.srce_set($$" + JSON.stringify(inReq.body) + "$$::jsonb) as x(message)";
    Postgres.FirstRow(sql, inRes);
});

//-------------------------------------------------------------list maps--------------------------------------------------------------------------
server.get("/map_list", function (inReq, inRes)
{
    var sql = "SELECT jsonb_agg(regex) regex FROM tps.map_rm";
    Postgres.FirstRow(sql, inRes);
});

//list unmapped items flagged to be mapped   ?srce=
server.get("/unmapped", function (inReq, inRes)
{
    var sql = "SELECT jsonb_agg(row_to_json(x)::jsonb) regex FROM tps.report_unmapped_recs('"+ inReq.query.srce + "') x";
    Postgres.FirstRow(sql, inRes);
});


//set one or more map definitions
server.post("/mapdef_set", bodyParser.json(), function (inReq, inRes)
{
    var sql = "SELECT x.message FROM tps.srce_map_def_set($$" + JSON.stringify(inReq.body) + "$$::jsonb) as x(message)";
    Postgres.FirstRow(sql, inRes);
});

//add entries to lookup table
server.post("/mapval_set", bodyParser.json(), function (inReq, inRes)
{
    var sql = "SELECT x.message FROM tps.map_rv_set($$" + JSON.stringify( inReq.body) + "$$::jsonb) as x(message)";
    Postgres.FirstRow(sql, inRes);
});

/*
send a csv with powershell:
wget -uri http://localhost/import  -Method Post -InFile "C:\Users\fleet\Downloads\d.csv"
bash
curl -v -F upload=@//mnt/c/Users/fleet/Downloads/d.csv localhost/import
*/

//-------------------------------------------------------------import data--------------------------------------------------------------------------

server.use("/import", upload.single('upload'), function (inReq, inRes) {

    //console.log(inReq.file);
    console.log("should have gotten file as post body here");
    var csv = inReq.file.buffer.toString('utf8')
    // create a new converter object
    //var jobj = csvtojson.fromString(csv).
    //{headers: "true", delimiter: ",", output: "jsonObj", flatKeys: "true"}
    csvtojson({ flatKeys: "true" }).fromString(csv).then(
        (x) => {
            //console.log(x);
            //inRes.json(x);

            //push to db
            var sql = "SELECT x.message FROM tps.srce_import($$";
            sql += inReq.query.srce;
            sql += "$$, $$" 
            sql += JSON.stringify(x)
            sql += "$$::jsonb) as x(message)"
            console.log("sql for insert here");
            //console.log(sql);

            Postgres.query(sql, (err, res) => {

                //Postgres.end();

                if (err === null) {
                    inRes.json(res.rows[0]);
                    Postgres.end();
                    return;
                }
                inRes.json(err.message);
                //Postgres.end();
                //handle error
            }
        );
        }
        //const jsonArray = csv().fromFile(csvFilePath);
        //csvtojson({ output: "csv" }).fromString(csv).then((jsonObj) => { console.log(jsonObj) });
        //validate the body contents before pushing to sql?
    );
    }
);

//-------------------------------------------------------------suggest source def--------------------------------------------------------------------------

server.use("/csv_suggest", upload.single('upload'), function (inReq, inRes) {

    //console.log(inReq.file);
    console.log("should have gotten file as post body here");
    var csv = inReq.file.buffer.toString('utf8')
    // create a new converter object
    //var jobj = csvtojson.fromString(csv).
    //{headers: "true", delimiter: ",", output: "jsonObj", flatKeys: "true"}
    csvtojson({ flatKeys: "true" }).fromString(csv).then(
        (x) => {
            //console.log(x);
            //inRes.json(x);

            //push to db
            var sug = {};
            for (var key in x[0]) {
                if (!isNaN(parseFloat(x[0][key])) && isFinite(x[0][key])) {
                    if (x[0][key].charAt(0) == "0"){
                        sug[key] = "text";
                    }
                    else {
                        sug[key] = "numeric";
                    }
                } 
                else if (Date.parse(x[0][key]) > Date.parse('1950-01-01') && Date.parse(x[0][key]) < Date.parse('2050-01-01')) {
                    sug[key] = "date";
                }
                else {
                    sug[key] = "text";
                }
            }
            console.log(sug);
            inRes.json(sug);
            //console.log(sql);
        }
        //const jsonArray = csv().fromFile(csvFilePath);
        //csvtojson({ output: "csv" }).fromString(csv).then((jsonObj) => { console.log(jsonObj) });
        //validate the body contents before pushing to sql?
    );
    }
);


server.get("/", function (inReq, inRes)
{
    inRes.render("definition", { title: "definition", layout: "main" });
});

module.exports = server;