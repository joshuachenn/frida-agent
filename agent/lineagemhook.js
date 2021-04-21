(function(){
    let Color = {RESET: "\x1b[39;49;00m", Black: "0;01", Blue: "4;01", Cyan: "6;01", Gray: "7;11", "Green": "2;01", Purple: "5;01", Red: "1;01", Yellow: "3;01"};
    let LightColor = {RESET: "\x1b[39;49;00m", Black: "0;11", Blue: "4;11", Cyan: "6;11", Gray: "7;01", "Green": "2;11", Purple: "5;11", Red: "1;11", Yellow: "3;11"};    
    var colorPrefix = '\x1b[3', colorSuffix = 'm'
    for (let c in Color){
        if (c  == "RESET") continue;
        console[c] = function(message){
            console.log(colorPrefix + Color[c] + colorSuffix + message + Color.RESET);
        }
        console["Light" + c] = function(message){
            console.log(colorPrefix + LightColor[c] + colorSuffix + message + Color.RESET);
        }
    }
})();
function uniqBy(array, key) {
    var seen = {};
    return array.filter(function (item) {
        var k = key(item);
        return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    });
}
function hasOwnProperty(obj, name) {
    try {
        return obj.hasOwnProperty(name) || name in obj;
    } catch (e) {
        return obj.hasOwnProperty(name);
    }
}
function getHandle(object) {
    if (hasOwnProperty(object, '$handle')) {
        if (object.$handle != undefined) {
            return object.$handle;
        }
    }
    if (hasOwnProperty(object, '$h')) {
        if (object.$h != undefined) {
            return object.$h;
        }
    }
    return null;
}
//查看域值
function inspectObject(obj, input) {
    var isInstance = false;
    var obj_class = null;
    if (getHandle(obj) === null) {
        obj_class = obj.class;
    } else {
        var Class = Java.use("java.lang.Class");
        obj_class = Java.cast(obj.getClass(), Class);
        isInstance = true;
    }
    input = input.concat("Inspecting Fields: => ", isInstance, " => ", obj_class.toString());
    input = input.concat("\r\n")
    var fields = obj_class.getDeclaredFields();
    for (var i in fields) {
        if (isInstance || Boolean(fields[i].toString().indexOf("static ") >= 0)) {
            // output = output.concat("\t\t static static static " + fields[i].toString());
            var className = obj_class.toString().trim().split(" ")[1];
            // console.Red("className is => ",className);
            var fieldName = fields[i].toString().split(className.concat(".")).pop();
            var fieldType = fields[i].toString().split(" ").slice(-2)[0];
            var fieldValue = undefined;
            if (!(obj[fieldName] === undefined))
                fieldValue = obj[fieldName].value;
            input = input.concat(fieldType + " \t" + fieldName + " => ", fieldValue + " => ", JSON.stringify(fieldValue));
            input = input.concat("\r\n")
        }
    }
    return input;
}

// trace单个类的所有静态和实例方法包括构造方法 trace a specific Java Method
function traceMethod(targetClassMethod) {
    var delim = targetClassMethod.lastIndexOf(".");
    if (delim === -1) return;
    var targetClass = targetClassMethod.slice(0, delim)
    var targetMethod = targetClassMethod.slice(delim + 1, targetClassMethod.length)
    var hook = Java.use(targetClass);
    var overloadCount = hook[targetMethod].overloads.length;
    console.Red("Tracing Method : " + targetClassMethod + " [" + overloadCount + " overload(s)]");
    for (var i = 0; i < overloadCount; i++) {
        hook[targetMethod].overloads[i].implementation = function () {
            //初始化输出
            var output = "";
            //画个横线
            for (var p = 0; p < 100; p++) {
                output = output.concat("==");
            }
            console.Gray(output);
            var output = "";
            //域值
            output = inspectObject(this, output);
            console.Blue(output);
            var output = "";
            //进入函数
            output = output.concat("\n*** entered " + targetClassMethod);
            output = output.concat("\r\n")
            if (arguments.length) console.Black();
            //参数
            for (var j = 0; j < arguments.length; j++) {
                output = output.concat("arg[" + j + "]: " + arguments[j] + " => " + JSON.stringify(arguments[j]));
                output = output.concat("\r\n")
            }
            //调用栈
            output = output.concat(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
            console.Green(output);
            var output = "";
            var retval = this[targetMethod].apply(this, arguments);
            //返回值
            output = output.concat("\nretval: " + retval + " => " + JSON.stringify(retval));
            // inspectObject(this)
            //离开函数
            output = output.concat("\n*** exiting " + targetClassMethod);
            //最终输出
            console.Black(output);
            return retval;
        }
    }
}

function traceClass(targetClass) {

    //Java.use是新建一个对象哈，大家还记得么？
    var hook = Java.use(targetClass);
    //利用反射的方式，拿到当前类的所有方法
    var methods = hook.class.getDeclaredMethods();    
    //建完对象之后记得将对象释放掉哈
    hook.$dispose;
    //将方法名保存到数组中
    var parsedMethods = [];
    var output = "";    
    output = output.concat("\tSpec: => \r\n")
    methods.forEach(function (method) {
        output = output.concat(method.toString())
        output = output.concat("\r\n")
        parsedMethods.push(method.toString().replace(targetClass + ".", "TOKEN").match(/\sTOKEN(.*)\(/)[1]);
    });
    //去掉一些重复的值
    var Targets = uniqBy(parsedMethods, JSON.stringify);
    // targets = [];
    var constructors = hook.class.getDeclaredConstructors();
    if (constructors.length > 0) {
        constructors.forEach(function (constructor) {
            output = output.concat("Tracing ", constructor.toString())
            output = output.concat("\r\n")
        })
        Targets = Targets.concat("$init")
    }
    //对数组中所有的方法进行hook，
    Targets.forEach(function (targetMethod) {
        traceMethod(targetClass + "." + targetMethod);
    });
    //画个横线
    for (var p = 0; p < 100; p++) {
        output = output.concat("+");
    }
    console.Green(output);
}
function hook(white, black, target = null) {
    console.Red("start")
    if (!(target === null)) {
        console.LightGreen("Begin enumerateClassLoaders ...")
        Java.enumerateClassLoaders({
            onMatch: function (loader) {
                try {
                    if (loader.findClass(target)) {
                        console.Red("Successfully found loader")
                        console.Blue(loader);
                        Java.classFactory.loader = loader;
                        console.Red("Switch Classloader Successfully ! ")
                    }
                }
                catch (error) {
                    console.Red(" continuing :" + error)
                }
            },
            onComplete: function () {
                console.Red("EnumerateClassloader END")
            }
        })
    }
    console.Red("Begin Search Class...")
    var targetClasses = new Array();
    Java.enumerateLoadedClasses({
        onMatch: function (className) {
            if (className.toString().indexOf(white) >= 0 &&
                className.toString().indexOf(black) < 0
            ) {
                console.Black("Found Class => ", className)
                targetClasses.push(className);
                traceClass(className);
            }
        }, onComplete: function () {
            console.Black("Search Class Completed!")
        }
    })
    var output = "On Total Tracing :"+String(targetClasses.length)+" classes :\r\n";
    targetClasses.forEach(function(target){
        output = output.concat(target);
        output = output.concat("\r\n")        
    })
    console.Green(output+"Start Tracing ...")
}











/*

use frida_dump to dump target so

*/


function LogPrint(log) {
    var theDate = new Date();
    var hour = theDate.getHours();
    var minute = theDate.getMinutes();
    var second = theDate.getSeconds();
    var mSecond = theDate.getMilliseconds();

    hour < 10 ? hour = "0" + hour : hour;
    minute < 10 ? minute = "0" + minute : minute;
    second < 10 ? second = "0" + second : second;
    mSecond < 10 ? mSecond = "00" + mSecond : mSecond < 100 ? mSecond = "0" + mSecond : mSecond;
    var time = hour + ":" + minute + ":" + second + ":" + mSecond;
    var threadid = Process.getCurrentThreadId();
    console.log("[" + time + "]" + "->threadid:" + threadid + "--" + log);

}

function printNativeStack(context, name) {
    //Debug.
    var trace = Thread.backtrace(context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join("\n");
    LogPrint("-----------start:" + name + "--------------");
    LogPrint(trace);
    LogPrint("-----------end:" + name + "--------------");

}

function printJavaStackTrace(name) {
    Java.perform(function() {
        var Exception = Java.use('java.lang.Exception')
        var ins = Exception.$new('Exception')
        var stackTraces = ins.getStackTrace()
        if (stackTraces != undefined && stackTraces != null) {
            var strace = stackTraces.toString()
            var replaceStr = strace.replace(/,/g, '\n')
            console.log("===============" + name + " stack start =============")
            console.log(replaceStr)
            console.log("===============" + name + " stack end ==============")
            Exception.$dispose()
        }
    })
}

function byteToString(arr) {
    if (typeof arr === 'string') {
        return arr;
    }
    var str = '',
        _arr = arr;
    for (var i = 0; i < _arr.length; i++) {
        var one = _arr[i].toString(2),
            v = one.match(/^1+?(?=0)/);
        if (v && one.length == 8) {
            var bytesLength = v[0].length;
            var store = _arr[i].toString(2).slice(7 - bytesLength);
            for (var st = 1; st < bytesLength; st++) {
                store += _arr[st + i].toString(2).slice(2);
            }
            str += String.fromCharCode(parseInt(store, 2));
            i += bytesLength - 1;
        } else {
            str += String.fromCharCode(_arr[i]);
        }
    }
    return str;
}

var lineagem_fp = null
function hook_libc() {
    var mmap_addr = Module.findExportByName("libc.so", "mmap64")
    var fopen_addr = Module.findExportByName("libc.so", "fopen64")
    var fwrite_addr = Module.findExportByName("libc.so", "fwrite")
    var fclose_addr = Module.findExportByName("libc.so", "fclose")
    var unlink_addr = Module.findExportByName('libc.so', "unlink")

    var unlink = new NativeFunction(unlink_addr, "int", ["pointer"])
    var fopen = new NativeFunction(fopen_addr, "pointer", ["pointer", "pointer"])
    var fwrite = new NativeFunction(fwrite_addr, "int", ["pointer", "int", "int", "pointer"])
    var fclose = new NativeFunction(fclose_addr, "int", ["pointer"])

    var fork_addr = Module.findExportByName(null, 'fork')
    console.log("fork addr:", JSON.stringify(fork_addr))
    Interceptor.attach(fork_addr, {
        onEnter: function(args) {
            console.log("++++++++++++++fork called")
        }, onLeave: function(retval) {
        }
    })



    // Interceptor.replace(unlink_addr, 
    //     new NativeCallback(function (arg0) {
    //     // if (arg0.readCString().indexOf("liblineage_sharedcpp.so")) {
    //     //     console.log("replacing unlink with null imp")
    //     //     return 0
    //     // }
    //     return unlink(arg0)
    // }, "int", ["pointer"]))

    // Interceptor.attach(unlink_addr, {
    //     onEnter: function(args) {
    //         var name = args[0].readCString()
    //         console.log("unlink file:", name)
    //     }, onLeave: function(retval) {
            
    //         // console.log(hexdump(retval))
    //     }
    // })
    
    Interceptor.attach(fopen_addr, {
        onEnter: function(args) {
            this.openpath = args[0].readCString()
            // if (this.openpath.indexOf("liblineage_sharedcpp") >= 0 ) {
                console.log("enter fopen name and type:", args[0].readCString(), args[1].readCString())
                printNativeStack(this.context, args[0].readCString())
            // }
        }, onLeave: function(retval) {
            if (this.openpath.indexOf("liblineage_sharedcpp") >= 0 ) {
                lineagem_fp = retval
                console.log("open fp:", retval, lineagem_fp)
            }
            // console.log(hexdump(retval))
        }
    })

    // Interceptor.attach(fwrite_addr, {
    //     onEnter: function(args) {
    //         console.log("threadid:", Process.getCurrentThreadId(), " write to:", args[3], " data:", hexdump(args[0], {length: parseInt(args[1])}))
    //         if (args[3] == lineagem_fp) {
    //             console.log("write to liblineage_sharedcpp")
    //         }       
    //     }, onLeave: function(retval) {
        
    //     }
    // })
    
    // Interceptor.attach(mmap_addr, {
    //     onEnter: function(args) {
    //         this.args = args
    //     }, onLeave: function(retval) {
    //         console.log("map address:")
    //         // Memory.protect(retval, parseInt(this.args[1]), 'rw-')
    //         console.log(hexdump(retval))
    //     }
    // })
    // Interceptor.attach(Module.findExportByName(null,"__dl_mmap64"), {
    //     onEnter: function(args) {
    //         this.args = args
    //     }, onLeave: function(retval) {
    //         console.log("map address:")
    //         // Memory.protect(retval, parseInt(this.args[1]), 'rw-')
    //         console.log(hexdump(retval))
    //     }
    // })
}

function hook_dlopen() {
    Interceptor.attach(Module.findExportByName(null, "dlopen"), {
        onEnter: function (args) {
            var pathptr = args[0];
            if (pathptr !== undefined && pathptr != null) {
                var path = ptr(pathptr).readCString();
                console.log("dlopen:", path);
                if (path.indexOf("libart.so") >= 0) {
                    this.can_hook_libart = true;
                    console.log("[dlopen:]", path);
                }
            } else {
                console.log("path undefined")
            }
        },
        onLeave: function (retval) {
            if (this.can_hook_libart && !is_hook_libart) {
                hook_dex();
                is_hook_libart = true;
            }
        }
    })

    Interceptor.attach(Module.findExportByName(null, "android_dlopen_ext"), {
        onEnter: function (args) {
            var pathptr = args[0];
            if (pathptr !== undefined && pathptr != null) {
                var path = ptr(pathptr).readCString();
                console.log("android_dlopen_ext:", path);
                if (path.indexOf("libart.so") >= 0) {
                    this.can_hook_libart = true;
                    console.log("[android_dlopen_ext:]", path);
                }
            } else {
                console.log("path undefined")
            }
        },
        onLeave: function (retval) {
            if (this.can_hook_libart && !is_hook_libart) {
                hook_dex();
                is_hook_libart = true;
            }
        }
    });
}

function hook_readElf() {
    // __dl__ZN9ElfReader13ReadElfHeaderEv
    Interceptor.attach(Module.findExportByName(null, "__dl__ZN9ElfReader13ReadElfHeaderEv"), {
        onEnter: function(args) {
            console.log("onEnter ReadELF")
        }, onLeave: function(retval) {
            console.log("onLeave ReadELF:", retval)
        }
    })


}

function hook_native() {

    var linker = Process.getModuleByName("linker64")
    var dlopen_addr = null;
    var symbols = linker.enumerateSymbols();

    // var liblineagem = Process.getModuleByName("liblineage_sharedcpp.so")
    // var lineSymbols = liblineagem.enumerateSymbols()
    // if (lineSymbols.length == 0) {
    //     console.log("symbol length = 0 module base:", JSON.stringify(liblineagem))
    // }
    // for (var m = 0; m < lineSymbols.length; m++) {
    //     console.log("find lineage_sharedcpp symbol name:", lineSymbols[m].name)
    // }



    // for (var m = 0; m < symbols.length; m++) {
    //     // __dl___dlopen(char const*, int, void const*)
    //     if (symbols[m].name == "__dl__Z8__dlopenPKciPKv") {
    //         dlopen_addr = symbols[m].address;
    //         console.log("find dlopen: ",symbols[m].name,"addr => ", dlopen_addr)
    //         Interceptor.attach(dlopen_addr, {
    //             onEnter: function(args) {
    //                 console.log("on dlopen:", args[0].readCString())
    //             }, onLeave:function(retval) {

    //             }
    //         })
    //         // break
    //     }

    //     if (symbols[m].name == "__dl__ZN9ElfReader13ReadElfHeaderEv") {
    //         var readelf_addr = symbols[m].address;
    //         console.log("find readelf_addr: ",symbols[m].name,"addr => ", readelf_addr)
    //         Interceptor.attach(readelf_addr, {
    //             onEnter: function(args) {
    //                 console.log("onEnter ReadELF")
    //                 console.log("name: ", args[0].readCString())
    //             }, onLeave: function(retval) {
    //                 console.log("onLeave ReadELF:", retval)
    //             }
    //         })
    //         // break
    //     }

    //     // __dl__ZN9ElfReader4ReadEPKcill
    //     if (symbols[m].name == "__dl__ZN9ElfReader4ReadEPKcill") {
    //         var read_addr = symbols[m].address;
    //         console.log("find read_addr: ",symbols[m].name,"addr => ", read_addr)
    //         Interceptor.attach(read_addr, {
    //             onEnter: function(args) {
    //                 console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    //                 console.log("name: ", args[0].readCString())
    //                 console.log("offset:", args[2]," size:", args[3])
    //                 console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    //                 printNativeStack(this.context, "ElfReader")
    //             }, onLeave: function(retval) {
    //                 console.log("verify result:", retval)
    //             }
    //         })
    //         // break
    //     }

    //     // __dl__ZN18MappedFileFragment3MapEilmm
    //     if (symbols[m].name == "__dl__ZN18MappedFileFragment3MapEilmm") {
    //         var read_addr = symbols[m].address;
    //         console.log("find FileMap: ",symbols[m].name,"addr => ", read_addr)
    //         Interceptor.attach(read_addr, {
    //             onEnter: function(args) {
    //                 // console.log("fd: ")
    //                 // console.log(hexdump(args[0]))
    //                 console.log("base offset:", args[1]," elf offset:", args[2], " map size:", args[3])
    //             }, onLeave: function(retval) {
    //             }
    //         })
    //         // break
    //     }

    //     // __dl__ZN9ElfReader18ReadProgramHeadersEv
    //     if (symbols[m].name == "__dl__ZN9ElfReader18ReadProgramHeadersEv") {
    //         var read_addr = symbols[m].address;
    //         console.log("find readProgramHeader: ",symbols[m].name,"addr => ", read_addr)
    //         Interceptor.attach(read_addr, {
    //             onEnter: function(args) {
    //                 // console.log("program header:", hexdump(args[0]))
    //                 printNativeStack(this.context, "ReadProgramHeader")
    //             }, onLeave: function(retval) {
    //             }
    //         })
    //         // break
    //     }


    //     // // __dl_do_dlopen(char const*, int, android_dlextinfo const*, void const*)
    //     // if (symbols[m].name == "__dl__Z9do_dlopenPKciPK17android_dlextinfoPKv") {
    //     //     dlopen_addr = symbols[m].address;
    //     //     console.log("name: ",symbols[m].name,"addr => ", dlopen_addr)
    //     // }

    //     // // __dl___android_dlopen_ext(char const*, int, android_dlextinfo const*, void const*)
    //     // if (symbols[m].name == "__dl__Z20__android_dlopen_extPKciPK17android_dlextinfoPKv") {
    //     //     dlopen_addr = symbols[m].address;
    //     //     console.log("name: ",symbols[m].name,"addr => ", dlopen_addr)
    //     // }
    // }
}

function hook_doApiRequest() {


        // com.ncsoft.android.mop.ConsoleHttp$ConsoleHttpHelper
        // com.ncsoft.android.mop.apigate.HttpHelper
        // com.ncsoft.android.mop.apigate.BaseHttpRequest
        // var NcJwt = Java.use('com.ncsoft.nc2sdk.channel.network.okhttp.NcJwt')
        // NcJwt.header.implementation = function(arg0, arg1, arg2, arg3) {
        //     var headerValue = this.header(arg0, arg1, arg2, arg3)
        //     console.log("arg0:", arg0.readString(), " arg1:", arg1.readString(), " JSON Obj:", JSON.stringify(arg3))
        //     return headerValue
        // }
        // var httpHelper = Java.choose('com.ncsoft.android.mop.apigate.HttpHelper')

    Java.perform(function() {
        var BaseHttpRequest = Java.use('com.ncsoft.android.mop.apigate.BaseHttpRequest')
        var HttpHelper = Java.use('com.ncsoft.android.mop.apigate.HttpHelper')

        HttpHelper.buildJwtHeader.implementation = function(arg0, arg1, arg2, arg3) {
            var ret = this.buildJwtHeader(arg0, arg1, arg2, arg3)
            console.log("go into builderJwtHeader: ", ret.toString())
            return ret
        }

        if (BaseHttpRequest != null) {
            console.log("BaseHttpRequest:", JSON.stringify(BaseHttpRequest))

            BaseHttpRequest.doApiRequest.implementation = function(arg0, arg1, arg2, arg3, arg4) {
                var headerValue = this.doApiRequest(arg0, arg1, arg2, arg3, arg4)
                console.log("[+]++++++++++++++++++++++++++++++++++++++++++++++++++++[+]")
                console.log("arg1:", parseInt(arg1))
                console.log("arg2:", arg2.toString())
                if (arg3 != null) {
                    console.log("arg3:", arg3.toString())
                }

                printJavaStackTrace(arg2.toString())

                console.log("[-]++++++++++++++++++++++++++++++++++++++++++++++++++++[-]")
                return headerValue
            }
        }
    })

}

function hook_loadLib() {
    Java.perform(function() {

        const system = Java.use('java.lang.System');
        const Runtime = Java.use('java.lang.Runtime');
        const VMStack = Java.use('dalvik.system.VMStack');
        const BaseDexClassLoader = Java.use('dalvik.system.BaseDexClassLoader')

        system.loadLibrary.implementation = function(libname) {

            console.log("loadLibrary:", libname)
            const loaded = Runtime.getRuntime().loadLibrary0(VMStack.getCallingClassLoader(), libname)
        }

        BaseDexClassLoader.getLdLibraryPath.implementation = function() {
            var searchPath = this.getLdLibraryPath();
            console.log("Library Search Path:", searchPath)
            return searchPath
        }
    })
}

function native_dumphex() {
    // var addr = 0x7bed3da000
    // var targetptr = new NativePointer(addr)
    // Memory.protect(targetptr, 0x1000, 'rwx');
    // console.log("dump result:")
    // console.log(targetptr.readByteArray(0x100))
}

function Java_LoadS() {
    if (Java.available) {
        Java.perform(function() {
            var NCGPApplication = Java.use('com.ncsoft.ncgp.NCGPApplication')
            NCGPApplication.LoadS.implementation = function(arg0) {
                var retVal = this.LoadS(arg0)
                console.log("LoadS:"+arg0.toString() +" key:"+retVal.toString())
                return retVal
            }

            // var hashArray = ['07201ee4c65e4213b5afa86a92a1ef05',
            //                 '391a08fdae9542d1a128b58427807ffe',
            //                 '7c6e8bbddd3f45719d9e7743e78de879',
            //                 '302f03dc9eaf4317a3e81d8266b7bd8c',
            //                 'a343915fd43a4dbab3fd52eb726d64d8',
            //                 '82545c6ca4784f1589d9dd2e59bc89a2',
            //                 'fcb190fa662943c0a7a6cf7bac4c4cc8',
            //                 '878c4f749b4e4f249559cd81fb95fa6a',
            //                 'b33a304427414e9f9dac09a6051cf0ac',
            //                 'd282d8d40359480a9fb6cb77c130d8e1',
            //                 '610951d7b4f84c0e99b16431d16422c1',
            //                 '3b5df2700100489896e6609c5d7e12ee']
            // for (var i = 0; i < hashArray.length; i++) {
            //     var hashKey = hashArray[i];
            //     var key = NCGPApplication.LoadS(hashKey)
            //     console.log(hashKey+": "+key+";")
            // }
            var hashKey = 'b93eff878e884f08835c370c78b5a8d2'
            var key = NCGPApplication.LoadS(hashKey)
            console.log(hashKey+": "+key+";")
        })
    }
}


function decodeJwtHeader() {
    if (Java.available) {
        Java.perform(function() {
            var Base64 = Java.use('android.util.Base64')
            Java.enumerateClassLoaders({
                onMatch:function(loader){
                    try {
                        if(loader.findClass("com.ncsoft.android.mop.apigate.HttpHelper")){
                            console.log("Succefully found loader!",loader);
                            Java.classFactory.loader = loader;                            

                            Java.use('com.ncsoft.android.mop.apigate.HttpHelper').buildJwtHeader.implementation = function(arg0, arg1, arg2, arg3) {
                                var headerString = this.buildJwtHeader(arg0, arg1, arg2, arg3)
                                var base64EncodeAry = headerString.split('.')
                                // console.log("now logging base64 encode params:", arg2, arg3)
                                // JWT base64encodexxxx
                                console.log("JWT "+ byteToString(Base64.decode(base64EncodeAry[0].split(' ')[1], 8)))
                                console.log(byteToString(Base64.decode(base64EncodeAry[1], 8)))
                                // part 3 not decrypted, current not concern
                                return headerString
                            }
                        }
                    } catch (error) {
                        // console.log("found error "+error)
                        
                    }
                },onComplete:function(){"enum completed!"}
            })


        })
    }
}

function hook_ncgp() {

    var libncgp = Process.findModuleByName('libncgp.so')

    Interceptor.attach(ptr((libncgp.base).add(0xD0778)), {
        onEnter: function(args) {
        
        }, onLeave: function(retval) {
            var env = Java.vm.getEnv()
            console.log('OutParam:', env.getStringUtfChars(retval, null).readCString())
        }
    })
}


function hook_strstr() {
    // var libcmodule = Process.getModuleByName("libc.so");
    // var strstr = libcmodule.getExportByName("strstr");
    var strstr = Module.findExportByName('libc.so', "strstr")
  
    var times = 0
    Interceptor.attach(strstr, {
      onEnter: function(args) {
        this.arg0 = args[0];
        this.arg1 = args[1];
  
        this.info = ptr(this.arg0).readUtf8String();
        this.flag = ptr(this.arg1).readUtf8String();

        // console.log("entering")
      },
      onLeave: function(retval) {

        // if(this.flag.indexOf("RegisterNativeFlag") != -1) {
        //     console.log("RegisterNativeFlag:"+this.info);
        // }

        if (this.flag.indexOf("JniMethodStart") != -1) {
          // if (this.info.indexOf("MainActivity.onCreate") != -1) {
          //   console.log("MainActivity.onCreate:"+this.info);
          //   retval.replace(0x1234);
          // }
        //   if (this.info.indexOf("NCGPApplication.LoadS") != -1) {
        //     // if (++times > 1) {
        //       console.log("NCGPApplication.LoadS:"+this.info);
        //     //   retval.replace(0x1234);
        //     // }
        //   }

            // filter 
            // org.cocos2dx.lib.Cocos2dxRenderer.nativeRender
            // eglSwapBuffers
            // nanoTime
            if (this.info.indexOf('ncsoft') == -1) {
                return
            }
            if (this.info.indexOf('nativeReadString') != -1 ||
            this.info.indexOf('Cocos2dxRenderer.nativeRender') != -1 ||
            this.info.indexOf('eglSwapBuffers') != -1 ||
            this.info.indexOf('nanoTime') != -1 || 
            this.info.indexOf('com.android.org.conscrypt.NativeCrypto') != -1 ||
            this.info.indexOf('LoadS') != -1) {
                return
            }
            console.log("JnimethodStart:", this.info)
        }

      }
    })
  }

function hook_login() {
    // var touchesBegin = Module.findExportByName('nativeTouchesBegin')
    if (Java.available) {
        Java.perform(function() {
            Java.enumerateClassLoaders({
                onMatch:function(loader){
                    try {
                        if(loader.findClass("com.ncsoft.android.mop.AuthManager")){
                            var AuthManager = Java.use('com.ncsoft.android.mop.AuthManager')
                            AuthManager.loginViaPlaync.implementation = function(arg0, arg1, arg2, arg3, arg4) {
                                console.log("loginViaPlaync")
                                return this.loginViaPlaync(arg0, arg1, arg2, arg3, arg4)
                            }
                            AuthManager.loginViaGuest.implementation = function(arg0, arg1, arg2) {
                                console.log("loginViaGuest")
                                return this.loginViaGuest(arg0, arg1, arg2)
                            }
                            AuthManager.verifySession.implementation = function(arg0, arg1) {
                                console.log('verifySession called')
                                printJavaStackTrace('verifySession')
                                return this.verifySession(arg0, arg1)
                            }
                        }
                    } catch (error) {

                    }
                }, onComplete: function() {}
            })

        })
    }
}

function hook_nativeSSL() {
    // var liblineage_sharedcpp = Module.getBaseAddress('libssl.so')
    // var SSL_write = liblineage_sharedcpp.add(0xB75ED4)
    var SSL_write_addr = Module.findExportByName("libssl.so", "SSL_write")
    // console.log('find liblineage_sharedcpp:', liblineage_sharedcpp.toString())
    Interceptor.attach(SSL_write_addr, {
        onEnter: function(args) {
            console.log("into SSL_Write")
            printNativeStack(this.context, 'SSL_write')
        }, onLeave: function(retval) {

        }
    })
}

function hook_bypassAntiDebug() {
    var ptrace_addr = Module.findExportByName(null, "ptrace")
    var ptrace = new NativeFunction(ptrace_addr, "long", ["int", "int", "pointer", "pointer"])

    var fork_addr = Module.findExportByName(null, "fork")
    var fork = new NativeFunction(fork_addr, "int", [])

    var fcount = 0
    Interceptor.replace(fork_addr, 
        new NativeCallback(function () {
            console.log("replaced fork func count:", ++count)
            if (fcount < 5) {
                return -1
            }
            return fork()
    },"int", []))

    var count = 0
    Interceptor.replace(ptrace_addr, 
        new NativeCallback(function (arg0, arg1, arg2, arg3) {
            console.log("replaced ptrace func count:", ++count)
            if (count < 5) {
                return -1
            }
            return ptrace(arg0, arg1, arg2, arg3)
    },"long", ["int", "int", "pointer", "pointer"]))
}

function main() {
    hook_bypassAntiDebug()
    // hook_doApiRequest()
    // hook_ncgp()
    // hook_strstr()
    Java_LoadS()
    // decodeJwtHeader()

    // hook_login()
    // Java.perform(function() {
    //     // traceClass("com.ncsoft.android.mop.AuthManager")
    //     // traceClass('com.ncsoft.android.mop.apigate.requests.AuthRequest')
    //     traceClass('com.ncsoft.android.mop.NcHttpRequest')
    // })

    // hook_nativeSSL()

}

setImmediate(main)