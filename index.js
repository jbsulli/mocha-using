var proxyquire = require('proxyquire');

/* copied from poxyquire */
// delete this module from the cache to force re-require in order to allow resolving test module via parent.module
delete require.cache[require.resolve(__filename)];
/* end copy */

var PARENT = module.parent;

module.exports = function(it){
    var stub_data = {};
    
    function itFn(test_stub_data){
        function newItFn(test, fn){
            var done = (fn.length > 0);
            if(done){
                it(test, done => {
                    setStubData(stub_data, test_stub_data);
                    var fin = () => {
                        clearStubData(stub_data);
                        done();
                    };
                    fin.data = stub_data.data;
                    fn.call(this, fin);
                });
            } else {
                it(test, () => {
                    setStubData(stub_data, test_stub_data);
                    fn.call(this, stub_data.data);
                    clearStubData(stub_data);
                });
            }
        }
        
        newItFn.only = function(test, fn){
            var done = (fn.length > 0);
            if(done){
                it.only(test, done => {
                    setStubData(stub_data, test_stub_data);
                    var fin = () => {
                        clearStubData(stub_data);
                        done();
                    };
                    fin.data = stub_data.data;
                    fn.call(this, fin);
                });
            } else {
                it.only(test, () => {
                    setStubData(stub_data, test_stub_data);
                    fn.call(this, stub_data.data);
                    clearStubData(stub_data);
                });
            }
        };
        
        newItFn.skip = function(test, fn){
            var done = (fn.length > 0);
            if(done){
                it.skip(test);
            } else {
                it.skip(test);
            }
        };
        
        return newItFn;
    }
    
    function using(stub_data){
        return { it: itFn(stub_data) };
    }
    
    using.require = function(module, stubs_fn){
        var module_file = require('module')._resolveFilename(module, PARENT);
        return proxyquire(module_file, stubs_fn(stub_data));
    };
    
    return using;
};

function clearStubData(stub_data){
    for(var prop in stub_data){
        delete stub_data[prop];
    }
}

function setStubData(stub_data, new_data){
    for(var field in new_data){
        stub_data[field] = new_data[field];
    }
    stub_data.data = {};
}