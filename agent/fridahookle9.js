function EnumerateAllExports() {

    var linker = Process.getModuleByName("linker")
    //console.log("exports=>",JSON.stringify(linker.enumerateSymbols()))
    var call_function_addr = null;
    var symbols = linker.enumerateSymbols();
    // console.log("module_name=>",module_name,"  module.enumerateExports = > ",JSON.stringify(exports))
    for (var m = 0; m < symbols.length; m++) {
        //console.log("m=>",m)
        // writeSomething("/sdcard/settings/linker"+".txt", "type:"+symbols[m].type+ " name:"+ symbols[m].name+" address:"+symbols[m].address+"\n")
        if (symbols[m].name == "__dl__ZL13call_functionPKcPFviPPcS2_ES0_") {
            call_function_addr = symbols[m].address;
            console.log("found call_function_addr => ", call_function_addr)
            hook_call_function(call_function_addr)
        }
        // console.log("type:"+symbols[m].type+ " name:"+ symbols[m].name+" address:"+symbols[m].address+"\n")
    }


    /*
    __dl__ZL13call_functionPKcPFvvES0_
    __dl_call_function(char const*, void (*)(), char const*)


    __dl__ZL13call_functionPKcPFviPPcS2_ES0_
    __dl_call_function(char const*, void (*)(int, char**, char**), char const*)
    */

}

function hook_call_function(_call_function_addr){
    console.log("hook call function begin!hooking address :=>",_call_function_addr)
    Interceptor.attach(_call_function_addr,{
        onEnter:function(args){
            if(args[2].readCString().indexOf("base.odex")<0){
                console.log("function_name : agrs[0]=>",args[0].readCString())
                console.log("so path : agrs[2]=>",args[2].readCString())
                console.log("function addr=>", args[1])
                console.log("function offset : args[1]=>","0x"+(args[1]-Module.findBaseAddress("libnative-lib.so")).toString(16))
            }
        },onLeave:function(retval){

        }
    })
}

function writeSomething(path,contents){
    var fopen_addr = Module.findExportByName("libc.so", "fopen");
    var fputs_addr = Module.findExportByName("libc.so", "fputs");
    var fclose_addr = Module.findExportByName("libc.so", "fclose");

    //console.log("fopen=>",fopen_addr,"  fputs=>",fputs_addr,"  fclose=>",fclose_addr);

    var fopen = new NativeFunction(fopen_addr,"pointer",["pointer","pointer"])
    var fputs = new NativeFunction(fputs_addr,"int",["pointer","pointer"])
    var fclose = new NativeFunction(fclose_addr,"int",["pointer"])

    console.log(path,contents)

    var fileName = Memory.allocUtf8String(path);
    var mode = Memory.allocUtf8String("a+");

    var fp = fopen(fileName,mode);

    var contentHello = Memory.allocUtf8String(contents);
    var ret = fputs(contentHello,fp)
    
    fclose(fp);
}

setImmediate(EnumerateAllExports)