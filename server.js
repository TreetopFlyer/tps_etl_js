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
server.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
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

Postgres.connect();

//-------------------------------------------------------------list source--------------------------------------------------------------------------

server.use("/srce_list", function (inReq, inRes) {

    var sql = "SELECT jsonb_agg(defn) source_list FROM tps.srce"
    console.log(sql);

    Postgres.query(sql, (err, res) => {
        inRes.json(res.rows[0]);
        console.log("source list request complete");
    });
}
);

//-------------------------------------------------------------list maps--------------------------------------------------------------------------

server.use("/map_list", function (inReq, inRes) {

    var sql = "SELECT jsonb_agg(regex) regex FROM tps.map_rm"
    console.log(sql);

    Postgres.query(sql, (err, res) => {

        if (err === null) {
            inRes.json(res.rows[0]);
            return;
        }
        inRes.json(err.message);
    });
}
);

//--------------------------------------------------------list unmapped items flagged to be mapped---------------------------------------------------

server.use("/unmapped", function (inReq, inRes) {

    var sql = "SELECT jsonb_agg(row_to_json(x)::jsonb) regex FROM tps.report_unmapped_recs('";
    sql += inReq.query.srce + "') x"
    console.log(sql);

    Postgres.query(sql, (err, res) => {

        if (err === null) {
            inRes.json(res.rows[0]);
            return;
        }
        inRes.json(err.message);
    });
}
);

//-------------------------------------------------------------set source via json in body--------------------------------------------------------------------------

server.use("/srce_set", bodyParser.json(), function (inReq, inRes) {
    
    //validate the body contents before pushing to sql?
    var sql = "SELECT x.message FROM tps.srce_set($$";
    sql += JSON.stringify( inReq.body);
    sql += "$$::jsonb) as x(message)";
    console.log(sql);

    Postgres.query(sql, (err, res) => {

        //Postgres.end();

        if (err === null) {
            inRes.json(res.rows[0]);
            return;
        }
        inRes.json(err.message);
        //handle error
    });
}
);

//-------------------------------------------------------------set one or more map definitions--------------------------------------------------------------------------

server.use("/mapdef_set", bodyParser.json(), function (inReq, inRes) {

    //validate the body contents before pushing to sql?
    var sql = "SELECT x.message FROM tps.srce_map_def_set($$";
    sql += JSON.stringify( inReq.body);
    sql += "$$::jsonb) as x(message)";
    console.log(sql);

    Postgres.query(sql, (err, res) => {

        //Postgres.end();

        if (err === null) {
            inRes.json(res.rows[0]);
            return;
        }
        inRes.json(err.message);
        //handle error
    });

}
);

//-------------------------------------------------------------add entries to lookup table--------------------------------------------------------------------------

server.use("/mapval_set", bodyParser.json(), function (inReq, inRes) {

    //validate the body contents before pushing to sql?
    var sql = "SELECT x.message FROM tps.map_rv_set($$";
    sql += JSON.stringify( inReq.body);
    sql += "$$::jsonb) as x(message)";
    console.log(sql);

    Postgres.query(sql, (err, res) => {

        //Postgres.end();

        if (err === null) {
            inRes.json(res.rows[0]);
            return;
        }
        inRes.json(err.message);
        //handle error
    });

}
);

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


    server.get("/", function (inReq, inRes) {
        inRes.render("definition", { title: "definition", layout: "main" });
    })

    module.exports = server;