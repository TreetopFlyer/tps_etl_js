var chai = require('chai');
var chaiHTTP = require('chai-http');

var server = require('../server.js');
var express;

var should = chai.should();
chai.use(chaiHTTP);

describe("tests", function(){
    before(function(done){
        express = server.listen(7357);
        done();
    });
    after(function(done){
        express.close();
        done();
    });
    it("should pass", function(done){
        var test = true;
        test.should.equal(true);
        done();
    });
});