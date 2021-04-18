function java_hook() {
    Java.perform(function() {
        var MainActivity = Java.use('com.example.demoso1.MainActivity')
        MainActivity.stringFromJNI.implementation = function (){
            var result = this.stringFromJNI()
            console.log("stringFromJNI:", result)
            return result
        }

        // MainActivity.myfirstjniJNI(Java.use('java.lang.String').$new('heh'))
        console.log(MainActivity.stringFromJNI())

        Java.choose("com.example.demoso1.MainActivity", {
            onMatch:function(instance) {
                console.log('Found instance!')
                instance.init()
            }, onComplete:function() {console.log('Search Complete!')}
        })
    })
}

var addrNewStringUTF = null
var NewStringUtf = null
// var moduleLibnative = Module.load('/data/app/libnative-lib.so')

function hook_RegisterNatives() {
    var symbols = Module.enumerateSymbolsSync("libart.so")
    var addrRegisterNatives = null
    for (var i = 0; i < symbols.length; i++) {
        var symbol = symbols[i]
        if (symbol.name.indexOf("art") >= 0 &&
            symbol.name.indexOf("JNI") >= 0 &&
            symbol.name.indexOf("NewStringUTF") >= 0 &&
            symbol.name.indexOf("CheckJNI") < 0) {
                addrNewStringUTF = symbol.address;
                console.log("NewStringUTF is at ", symbol.address)
                NewStringUtf = new NativeFunction(addrNewStringUTF, 'pointer', ['pointer', 'pointer'])
            }

    }
}

function native_hook() {
    var native_lib_addr = Module.findBaseAddress('libnative-lib.so')
    console.log('native_lib_addr =>', native_lib_addr)

    // var myfirstjniJNI = Module.findExportByName('libnative-lib.so', 'Java_org_joshua_demo_MainActivity_encryptArgs')
    var myfirstjniJNI = Module.getExportByName('libnative-lib.so', 'Java_com_example_demoso1_MainActivity_myfirstjniJNI')
    console.log('myfirstjniJNI addr => ', myfirstjniJNI)

    Interceptor.attach(myfirstjniJNI, {
        onEnter:function(args) {
            
            var env = Java.vm.getEnv()
            var jstringArg = env.newStringUtf("replacing arg")
            // var jstringArg = NewStringUtf(env, Memory.allocUtf8String('replacing jstring arg'))
            args[2] = jstringArg
            console.log('jstring arg addr=', jstringArg)
            env.releaseStringUtfChars(jstringArg, env.getStringUtfChars(jstringArg, null))
        }, onLeave: function(ret) {
            // var env = Java.vm.getEnv()
            // console.log("Interceptor.attach myfirstjniJNI retval => ",ret)
            // console.log('ret value:', env.getStringUtfChars(ret, null).readCString())
            // var newRet = Java.vm.getEnv().newStringUtf('new ret value from frida')
            // ret.replace(newRet)
        }
    })
    var myfirstjniJNI_invoke = new NativeFunction(myfirstjniJNI,"pointer",["pointer","pointer","pointer"])
    Interceptor.replace(myfirstjniJNI, new NativeCallback(function(arg0, arg1, arg2) {
        var result = myfirstjniJNI_invoke(arg0, arg1, arg2)
        return Java.vm.getEnv().newStringUtf("new args3 from frida")
    }, "pointer", ["pointer","pointer","pointer"]))
    Interceptor.replace()
}

function main() {
    // java_hook()
    hook_RegisterNatives()
    native_hook()
}


setImmediate(main)
