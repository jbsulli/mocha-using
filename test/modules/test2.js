var process = require('process');

module.exports = function(){
    return process.env;
};

module.exports.next = function(cb){
    return process.nextTick(cb);
};

module.exports.wtf = process.wtf;