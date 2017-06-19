const randomBytes = require('crypto').randomBytes;

module.exports = function(cb){
    randomBytes(16, cb);
};