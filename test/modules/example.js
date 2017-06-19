var crypto = require('crypto');

module.exports = function(cb){
    crypto.randomBytes(16, cb);
};