function EnumerateAllExports() {
    var modules = Process.enumerateModules()

    for (var i = 0; i < modules.length; i++) {
        var modeule = modules[i];
        var module_name = modeule.name
        var exports = modeule.enumerateExports()
        console.log("+++++++++++++++++++++++++++++++++++++++++++"+"\n")
        console.log("module_name=>", module_name, ":exports=>", JSON.stringify(exports), "\n")
        console.log("+++++++++++++++++++++++++++++++++++++++++++"+"\n")
    }
}

function hook_JNI() {
    var GetStringUTFChars_addr = null
    var symbols = Process.findModuleByName("libart.so").enumerateSymbols()

    // console.log(JSON.stringify(symbols))

    // {"isGlobal":true,"type":"function","section":{"id":"12.text","protection":"r-x"},"name":"_ZN3art8verifier14MethodVerifier17CheckBranchTargetEj","address":"0x714ea43fcc","size":356}
    for (var i = 0; i < symbols.length; i++) {
        var symbol = symbols[i];
        // console.log("+++++++++++++++++++++++++++++++++++++++++++"+"\n")
        // console.log("symbol=>", JSON.stringify(symbol), "\n")
        // console.log("+++++++++++++++++++++++++++++++++++++++++++"+"\n")
        var symbol_name = symbol.name
        if (symbol_name.indexOf("CheckJNI")==-1 && (symbol_name.indexOf("JNI")>=0)) {
            if (symbol_name.indexOf("GetStringUTFChars") >= 0) {
                // _ZN3art3JNI17GetStringUTFCharsEP7_JNIEnvP8_jstringPh
                // art::JNI::GetStringUTFChars(_JNIEnv*, _jstring*, unsigned char*)
                console.log("found GetStringUTFChars FULL NAME=>", symbol_name)
                GetStringUTFChars_addr = symbol.address
                console.log("found GetStringUTFChars addr=>", GetStringUTFChars_addr)
                break
            }
        }
    }

    Interceptor.attach(GetStringUTFChars_addr, {
        onEnter: function(args) {
            console.log("GetStringUTFChars_addr=>", GetStringUTFChars_addr)
            console.log("art::JNI::GetStringUTFChars(_JNIEnv*, _jstring*, unsigned char*)=>",args[0],Java.vm.getEnv().getStringUtfChars( args[1],null).readCString(),args[2])
            console.log('CCCryptorCreate called from:\n' +
            Thread.backtrace(this.context, Backtracer.ACCURATE)
            .map(DebugSymbol.fromAddress).join('\n') + '\n');
        }, onLeave:function(retval) {
            console.log("retval is => ",retval.readCString());
        }
    })

}

function hook_ReplaceJNI() {
    var NewStringUTF_addr = null
    var symbols = Process.findModuleByName("libart.so").enumerateSymbols()

    // console.log(JSON.stringify(symbols))

    for (var i = 0; i < symbols.length; i++) {
        var symbol = symbols[i];
        var symbol_name = symbol.name
        if (symbol_name.indexOf("CheckJNI")==-1 && (symbol_name.indexOf("JNI")>=0)) {
            if (symbol_name.indexOf("NewStringUTF") >= 0) {
                // _ZN3art3JNI12NewStringUTFEP7_JNIEnvPKc
                // art::JNI::NewStringUTF(_JNIEnv*, char const*)
                console.log("found NewStringUTF FULL NAME=>", symbol_name)
                NewStringUTF_addr = symbol.address
                console.log("found NewStringUTF addr=>", NewStringUTF_addr)
                break
            }
        }
    }

    var NewStringUTF = new NativeFunction(NewStringUTF_addr, "pointer", ["pointer", "pointer"])

    Interceptor.replace(NewStringUTF, new NativeCallback(function(parg1, parg2) {
        console.log("parg1,parg2=>",parg1,parg2.readCString());
        // console.log('CCCryptorCreate called from:\n' +
        //  Thread.backtrace(this.context, Backtracer.ACCURATE)
        //  .map(DebugSymbol.fromAddress).join('\n') + '\n');
        var newPARG2 = Memory.allocUtf8String("newPARG2")
        var result = NewStringUTF(parg1,newPARG2);
        return result;
    },"pointer",
    ["pointer","pointer"]))
}

function hook_RegisterNatives() {
    var RegisterNatives_addr = null
    var symbols = Process.findModuleByName("libart.so").enumerateSymbols()

    // console.log(JSON.stringify(symbols))

    for (var i = 0; i < symbols.length; i++) {
        var symbol = symbols[i];
        var symbol_name = symbol.name
        if (symbol_name.indexOf("CheckJNI")==-1 && (symbol_name.indexOf("JNI")>=0)) {
            if (symbol_name.indexOf("RegisterNatives") >= 0) {
                console.log("found RegisterNatives FULL NAME=>", symbol_name)
                RegisterNatives_addr = symbol.address
                console.log("found RegisterNatives addr=>", RegisterNatives_addr)
                break
            }
        }
    }

    // Yang's github
    if(RegisterNatives_addr!=null){
        Interceptor.attach(RegisterNatives_addr,{
            onEnter:function(args){
                console.log("[RegisterNatives]method counts :",args[3]);
                var env = args[0];
                var jclass = args[1];
                var class_name = Java.vm.tryGetEnv().getClassName(jclass);
                var methods_ptr = ptr(args[2]);
                var method_count = parseInt(args[3]);
                for (var i = 0; i < method_count; i++) {
                    var name_ptr = Memory.readPointer(methods_ptr.add(i * Process.pointerSize * 3));
                    var sig_ptr = Memory.readPointer(methods_ptr.add(i * Process.pointerSize * 3 + Process.pointerSize));
                    var fnPtr_ptr = Memory.readPointer(methods_ptr.add(i * Process.pointerSize * 3 + Process.pointerSize * 2));
                    var name = Memory.readCString(name_ptr);
                    var sig = Memory.readCString(sig_ptr);
                    var find_module = Process.findModuleByAddress(fnPtr_ptr);
                    // [RegisterNatives] java_class: com.example.demoso1.MainActivity name: stringFromJNI2 sig: ()Ljava/lang/String; fnPtr: 0x71345941b4 module_name: libnative-lib.so module_base: 0x7134584000 offset: 0x101b4
                    console.log("[RegisterNatives] java_class:", class_name, "name:", name, "sig:", sig, "fnPtr:", fnPtr_ptr, "module_name:", find_module.name, "module_base:", find_module.base, "offset:", ptr(fnPtr_ptr).sub(find_module.base));
                }
            },onLeave:function(retval){
            }
        })

    }
}

setImmediate(hook_RegisterNatives)