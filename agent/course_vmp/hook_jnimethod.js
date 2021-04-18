function hook() {
    // var libcmodule = Process.getModuleByName("libc.so");
    // var strstr = libcmodule.getExportByName("strstr");
    var strstr = Module.findExportByName(null, "strstr")
  
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
            if (++times > 1) {
              console.log("NCGPApplication.LoadS:"+this.info);
              retval.replace(0x1234);
            }
          }
        }

      }
    })

    var exit_addr = Module.findExportByName(null, "_exit")
    Interceptor.attach(exit_addr, {
      onEnter: function(args) {
        console.log("+++++++++exit called++++++++++")
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
            // if (fcount < 5) {
                return -1
            // }
            return fork()
    },"int", []))

    var count = 0
    Interceptor.replace(ptrace_addr, 
        new NativeCallback(function (arg0, arg1, arg2, arg3) {
            console.log("replaced ptrace func count:", ++count)
            if (count < 4) {
                return -1
            }
            return ptrace(arg0, arg1, arg2, arg3)
    },"long", ["int", "int", "pointer", "pointer"]))
}
  
  function main() {
    hook_bypassAntiDebug()
    hook();
  }
  
  setImmediate(main)