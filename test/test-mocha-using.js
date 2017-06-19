/* globals describe, it */

const chai = require('chai');
const expect = chai.expect;
const mochaUsing = require('../index.js');
const nextTick = require('process').nextTick;

var fakeIt = function(cb){
    var tests = {};
    var skip = {};
    var only = {};
    
    function fakeIt(test, fn){
        tests[test] = fn;
    }
    
    fakeIt.only = function(test, fn){
        only[test] = fn;
    };
    
    fakeIt.skip = function(test, fn){
        skip[test] = fn;
    };
    
    nextTick(() => {
        var test, fn;
        
        var wait = 1;
        var waitDone = function(){
            if(--wait === 0){
                cb(tests, only, skip);
            }
        };
        
        var run = tests;
        
        if(only && Object.keys(only).length){
            run = only;
        }
        
        for(test in run){
            fn = run[test];
            if(fn.length > 0){
                wait++;
                run[test](waitDone);
            } else {
                run[test]();
            }
        }
        
        waitDone();
    });
    
    return fakeIt;
};

describe('mocha-using', () => {
    it('should be a function', () => {
        expect(mochaUsing).to.be.a('function');
    });
    
    it('should return a using function', () => {
        var using = mochaUsing(() => {});
        expect(using).to.be.a('function');
    });
    
    it('should use the stubs (test1)', done => {
        var it = fakeIt(finished);
        var using = mochaUsing(it);
        var bytesValue;
        
        var test1 = using.require('./modules/test1', use => {
            return {
                crypto: {
                    randomBytes: function(bytes, cb){
                        var data = use.randomBytesResponse;
                        nextTick(() => {
                            cb.apply(null, data);
                        });
                    }
                }
            };
        });
        
        using({ randomBytesResponse:[null, 'haha'] })
        .it('should return random bytes', done => {
            test1((err, bytes) => {
                if(err) throw err;
                expect(bytes).to.equal('haha');
                bytesValue = bytes;
                done();
            });
        });
        
        function finished(){
            expect(bytesValue).to.equal('haha');
            done();
        }
    });
    
    it('should use vanilla proxyquire for non-function values', done => {
        var it = fakeIt(finished);
        var using = mochaUsing(it);
        var d, d2, env, wtf;
        
        var test2 = using.require('./modules/test2', use => {
            return {
                process: {
                    env: {
                        foo: 'bar'
                    },
                    nextTick: function(cb){
                        var wait = use.nextWait;
                        setTimeout(cb, wait);
                    },
                    wtf: null
                }
            };
        });
        
        using({ nextWait:50 })
        .it('should wait 50ms', done => {
            var t = Date.now();
            test2.next(() => {
                d = Date.now() - t;
                done();
            });
        });
        
        using({ nextWait:100 })
        .it('should wait 100ms', done => {
            var t = Date.now();
            test2.next(() => {
                d2 = Date.now() - t;
                done();
            });
        });
        
        it('should have foo in the env', () => {
            env = test2();
        });
        
        it('should copy over a null value without hiccups', () => {
            wtf = test2.wtf;
        });
        
        function finished(){
            expect(d).to.be.above(49);
            expect(d).to.be.below(60);
            expect(d2).to.be.above(99);
            expect(d2).to.be.below(110);
            expect(env).to.deep.equal({ foo:'bar' });
            expect(wtf).to.equal(null);
            done();
        }
    });
    
    describe('.require()', () => {
        it('should behave like a require', () => {
            var using = mochaUsing(() => {});
            var test = using.require('./modules/require.js', use => {
                return {
                    test: function(){}
                };
            });
            expect(test()).to.equal('require worked!');
            expect(test.certain()).to.equal('absolutely');
        });
    });
    
    describe('using()', () => {
        it('should have it, it.skip, and it.only on it', () => {
            var using = mochaUsing(() => {});
            expect(using).to.be.a('function');
            expect(using({}).it).to.be.a('function');
            expect(using({}).it.only).to.be.a('function');
            expect(using({}).it.skip).to.be.a('function');
        });
        
        describe('.it()', () => {
            it('should call "it" internally', done => {
                var hit = '';
                var it = fakeIt(finish);
                var using = mochaUsing(it);
                
                using({ test:true })
                .it('should be similar to it', () => {
                    hit += 'test fn';
                });
                
                function finish(tests){
                    expect(hit).to.equal('test fn');
                    done();
                }
            });
            
            it('should call "it" with done internally', done => {
                var hit = '';
                var it = fakeIt(finish);
                var using = mochaUsing(it);
                
                using({ test:true })
                .it('should be similar to it', done => {
                    hit += 'test fn';
                    setTimeout(() => {
                        hit += ' callback';
                        done();
                    }, 100);
                });
                
                function finish(tests){
                    expect(hit).to.equal('test fn callback');
                    done();
                }
            });
        });
        
        describe('.it.only()', () => {
            it('should call "it" internally', done => {
                var hit = '';
                var it = fakeIt(finish);
                var using = mochaUsing(it);
                
                using({ test:true })
                .it.only('should be similar to it', () => {
                    hit += 'test fn';
                });
                
                function finish(tests){
                    expect(hit).to.equal('test fn');
                    done();
                }
            });
            
            it('should call "it" with done internally', done => {
                var hit = '';
                var it = fakeIt(finish);
                var using = mochaUsing(it);
                
                using({ test:true })
                .it.only('should be similar to it', done => {
                    hit += 'test fn';
                    setTimeout(() => {
                        hit += ' callback';
                        done();
                    }, 100);
                });
                
                function finish(tests){
                    expect(hit).to.equal('test fn callback');
                    done();
                }
            });
        });
        
        describe('.it.skip()', () => {
            it('should call "it" internally', done => {
                var hit = '';
                var it = fakeIt(finish);
                var using = mochaUsing(it);
                
                using({ test:true })
                .it.skip('should be skipped', () => {
                    hit += 'skip me!';
                });
                
                using({ test:true })
                .it('should be similar to it', () => {
                    hit += 'test fn';
                });
                
                function finish(tests){
                    expect(hit).to.equal('test fn');
                    done();
                }
            });
            
            it('should call "it" with done internally', done => {
                var hit = '';
                var it = fakeIt(finish);
                var using = mochaUsing(it);
                
                using({ test:true })
                .it.skip('should be skipped', done => {
                    hit += 'skip me!';
                    setTimeout(() => {
                        hit += ' callback';
                        done();
                    }, 100);
                });
                
                using({ test:true })
                .it('should be similar to it', done => {
                    hit += 'test fn';
                    setTimeout(() => {
                        hit += ' callback';
                        done();
                    }, 100);
                });
                
                function finish(tests){
                    expect(hit).to.equal('test fn callback');
                    done();
                }
            });
        });
    });
});