# mocha-using
A smarter way to mock in Mocha.

## Description

If you ever find yourself writing large mocked functions that have giant switch/conditional statements used to determine what test is currently happening and how the current mock should respond, this module is for you!

In the background, this module uses [proxyquire](https://github.com/thlorenz/proxyquire) to handle the mocks. This means the only code values you can mock are `require()` responses. For me, this really made sense because code should be unmodified when testing and doing coverage reports.

## Installing

```
npm install --save-dev mocha-using
```

## Using

#### my-module.js
```javascript
var crypto = require('crypto');

module.exports = function(cb){
    crypto.randomBytes(16, cb);
};
```

#### test.js
```javascript
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
    }
};

// note: need to pass the `it` function
const using = require('mocha-using')(it);

// works like a normal require but will use proxyquire to add the stubs
const myModule = using.require('./my-module.js', stubs);

// ready to write our unit tests!
describe('MyModule', () => {
    using({
        randomBytesResponse:[null, Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')]
    })
    .it('should return 16 random bytes', done => {
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
```
 
**Note**: You can also do `using().it.only()` and `using().it.skip()` as well!

That mostly sums up the supported functionality. Let me know if you like it or have feature requests/bugs! Thanks for checking out my module!