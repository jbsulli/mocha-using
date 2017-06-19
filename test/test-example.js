/* globals describe, it */

const chai = require('chai');
const expect = chai.expect;

// our stubs (could be in separate file)
const stubs = use => { 
    return {
        crypto: {
            randomBytes: function(bytes, cb){
                // we are simply going to look at the `using` object and grab the args the mock
                // should return from that object's `randomBytesResponse` value
                var response_args = 
                    use.randomBytesResponse || 
                    [null, Buffer.from('ffffffffffffffffffffffffffffffff', 'hex')];
                process.nextTick(() => {
                    cb.apply(null, response_args);
                });
            }
        }
    };
};

// note: need to pass the `it` function
const using = require('../index.js')(it);

// works like a normal require but will use proxyquire to add the stubs
const myModule = using.require('./modules/example.js', stubs);

// ready to write our unit tests!
describe('Example code', () => {
    using({
        randomBytesResponse:[null, Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')]
    })
    .it('should call callback with random bytes', done => {
        myModule((err, bytes) => {
            if(err) throw err;
            // this would normally be random but, with our stub, we get a consistent value
            expect(bytes.toString('hex')).to.equal('000102030405060708090a0b0c0d0e0f');
            done();
        });
    });
    
    using({
        randomBytesResponse:[new Error('bad juju!')]
    })
    .it('should pass errors back', done => {
        myModule((err, bytes) => {
            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.equal('bad juju!');
            done();
        });
    });
    
    it('should return 16 random bytes', done => {
        myModule((err, bytes) => {
            if(err) throw err;
            // although we didn't pass any data to use for this test, the stub is
            // still active and will use the default
            expect(bytes.toString('hex')).to.equal('ffffffffffffffffffffffffffffffff');
            done();
        });
    });
});