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

function hook_ncgp() {

    Java.perform(function() {
        var NCGPApplication = Java.use('com.ncsoft.ncgp.NCGPApplication')
        NCGPApplication.LoadS.implementation = function(arg0) {
            var retVal = this.LoadS(arg0)
            console.log('>==================LoadS===================<')
            console.log(arg0.toString())
            // printJavaStackTrace('NCGPApplication.LoadS')
            console.log("ret:", retVal.toString())
            console.log('^==================LoadS end===================^')
            return retVal
        }
        var key = NCGPApplication.LoadS('878c4f749b4e4f249559cd81fb95fa6a')
        console.log('++++++++key:', key)
    })

    var libncgp = Process.findModuleByName('libncgp.so')
    var loadS_addr = (libncgp.base).add(0xD0778)
    console.log("loads_addr:", loadS_addr)

    Interceptor.attach(ptr(loadS_addr), {
        onEnter: function(args) {
            
            console.log("on enter Java_com_ncsoft_ncgp_NCGPApplication_LoadS")
            // console.log("InParam:", args[1], hexdump(ptr(this.context.x1)))
            // printNativeStack(this.context, 'LoadS')
        }, onLeave: function(retval) {
            var env = Java.vm.getEnv()
            console.log('OutParam:', env.getStringUtfChars(retval, null).readCString())
        }
    })

    var subB29DC = libncgp.base.add(0xB29DC)

    Interceptor.attach(subB29DC, {
        onEnter: function(args) {
            console.log("+++onEnter subB29DC: ", args[1].readCString())
            console.log("arg1:", args[1])
            printNativeStack(this.context, 'subB29DC')
        }, onLeave:function(retval) {
        }
    })

    var T3hUpz39vsuWrmlDyEe9 = Module.findExportByName('libncgp.so', 'T3hUpz39vsuWrmlDyEe9')
    Interceptor.attach(T3hUpz39vsuWrmlDyEe9, {
        onEnter:function(args) {
            console.log("============= enter: T3hUpz39vsuWrmlDyEe9")
        }, onLeave: function(retval) {

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

        if(this.flag.indexOf("RegisterNativeFlag") != -1) {
            console.log("RegisterNativeFlag:"+this.info);
        }

        if (this.flag.indexOf("JniMethodStart") != -1) {
          // if (this.info.indexOf("MainActivity.onCreate") != -1) {
          //   console.log("MainActivity.onCreate:"+this.info);
          //   retval.replace(0x1234);
          // }
          if (this.info.indexOf("NCGPApplication.LoadS") != -1) {
            // if (++times > 1) {
              console.log("NCGPApplication.LoadS:"+this.info);
            //   retval.replace(0x1234);
            // }
          }
        }

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
    hook_ncgp()
    // hook_strstr()

}

setImmediate(main)