function EnumerateAllExports() {

    var linker = Process.getModuleByName("linker64")
    var dlopen_addr = null;
    var symbols = linker.enumerateSymbols();
    for (var m = 0; m < symbols.length; m++) {
        // __dl___dlopen(char const*, int, void const*)
        if (symbols[m].name == "__dl__Z8__dlopenPKciPKv") {
            dlopen_addr = symbols[m].address;
            console.log("name: ",symbols[m].name,"addr => ", dlopen_addr)
            hook_function(dlopen_addr)
        }

        // __dl_do_dlopen(char const*, int, android_dlextinfo const*, void const*)
        if (symbols[m].name == "__dl__Z9do_dlopenPKciPK17android_dlextinfoPKv") {
            dlopen_addr = symbols[m].address;
            console.log("name: ",symbols[m].name,"addr => ", dlopen_addr)
            hook_function(dlopen_addr)
        }

        // __dl___android_dlopen_ext(char const*, int, android_dlextinfo const*, void const*)
        if (symbols[m].name == "__dl__Z20__android_dlopen_extPKciPK17android_dlextinfoPKv") {
            dlopen_addr = symbols[m].address;
            console.log("name: ",symbols[m].name,"addr => ", dlopen_addr)
            hook_function(dlopen_addr)
        }

        // console.log("type:"+symbols[m].type+ " name:"+ symbols[m].name+" address:"+symbols[m].address+"\n")
    }
}

function hook_function(dlopen_addr) {
    Interceptor.attach(dlopen_addr, {
        onEnter: function(args) {
            console.log("arg0=>", args[0].readCString(), "arg2=>", args[2].readCString())
        }, onLeave:function(retval) {
            
        }
    })
}

// Java_com_zing_zalocore_utils_cryptology_CoreUtils_encodeHttpParamsNative
// Java_com_zing_zalocore_utils_cryptology_CoreUtils_generateSignatureNative

var libnative = "libnative_utils.so"

function hook_libnative() {
    var encodeHttpParamsNative_addr = Module.findExportByName("libnative_utils.so", "Java_com_zing_zalocore_utils_cryptology_CoreUtils_encodeHttpParamsNative")
    var generateSignatureNative_addr = Module.findExportByName("libnative_utils.so", "Java_com_zing_zalocore_utils_cryptology_CoreUtils_generateSignatureNative")

    Interceptor.attach(encodeHttpParamsNative_addr, {
        onEnter:function(args) {
            console.log()
        }, onLeave: function(retval) {
            console.log("retval=>", retval)
            return retval
        }
    })
}

function hook_java() {
    Java.perform(function() {
        Java.use("com.zing.zalocore.connection.l").a.overload('java.lang.String', 'java.lang.String', 'java.lang.String', 'java.util.Hashtable')
        .implementation = function(str1, str2, str3, hashtable) {
            var result = this.a(str1, str2, str3, hashtable)
            // 5568
            console.log("str1:", str1, "str2:" , str2, "str3:", str3.length)
            console.log("hash:", JSON.stringify(hashtable))
            console.log("result: ", result)
            return result
        }

        /*
        {"ckeyset":"AAHx0nY2NSI","width":"1080","height":"1794","error_code_fallback":"1","model":"Google_Pixel_8.1.0","distributor_mobile_tracking":"","clientVersion":"12100549","heap":"512","avatarSize":"160","client_version":"12100549","advertising_id":"c0ee8699-11f3-4fe2-b755-e241c7f43213","phone_num":"+8615689451258","build_info":"{\"APK_LANGUAGE\":\"0\",\"APPLICATION_ID\":\"com.zing.zalo\",\"BUILDER\":\"khanhtm\",\"BUILD_ID\":\"d644d338-160e-4120-8b7a-0b783053d1ba\",\"BUILD_LITE_MODE\":\"false\",\"BUILD_MEDIUM_MODE\":\"false\",\"BUILD_PLAY_STORE\":\"true\",\"BUILD_TIME\":\"2020\\\/12\\\/01 02:33:27\",\"BUILD_TYPE\":\"release\",\"CI\":\"true\",\"DEBUG\":\"false\",\"DISABLE_MULTIDEX\":\"false\",\"DISTRIBUTOR\":\"GOO\",\"ENABLE_BITMAP_POOL\":\"true\",\"ENABLE_DEBUG_BRIDGE_STETHO\":\"false\",\"ENABLE_DEBUG_LEAK_CANARY\":\"false\",\"ENABLE_FINGERPRINT\":\"true\",\"ENABLE_FIREBASE_CRASHLYTICS\":\"true\",\"ENABLE_NETWORK_CONTROL\":\"true\",\"GIT_BRANCH\":\"release_201101\",\"GIT_COMMIT\":\"0871bffe1455\",\"PRELOAD_BUILD\":\"false\",\"USE_FILE_LOGGING\":\"true\",\"USE_QUICK_STICKER_POPUP_MSG\":\"true\",\"USE_SMS_FEATURE\":\"false\",\"VERSION_CODE\":\"12100549\",\"VERSION_NAME\":\"20.11.01\"}","mac_address":"40:4E:36:25:B6:D2","device_identifier":"2002.SSZ-wu8DGTLrXQddcmj2d26MfkpQKrwCVOVjejrLNuPzXwQhtr4GW7g5fwZVLnID.1","local_time":"1613724495643","sign":"","zcid":"1_8BDCCE7031507C573A4B19C83D009A3C8B5A9429B2ECE0AC320BA44FE6DA6F796EC6345146C465CC60B6C369255222B2ED2ACD13BE7673308843DA4E3EC83C73B691E4428ECCC4F6C5784886C6BF934F","network":"0","time_zone":"+08:00","protover":"1","distributor":"GOO","source_type":"1","language":"en_HK","android_id":"cddc78e23649ff20","imei":"352531086233572","cs":"7ad1cddec8101b35cc2fa47c46b8c84f","checkActiveCode":"1","deviceInfo":"{\"CPU_Processor\":\"aarch64\",\"CPU_Hardware\":\"\",\"CPU_Architecture\":\"8\",\"CPU_MAXFreq\":\"1593\",\"CPU_MINFreq\":\"307\",\"CPU_NumCore\":\"4\",\"Model\":\"Pixel\",\"Battery_Technology\":\"Li-ion\",\"Temperature\":\"33.7\",\"Voltage\":\"4399\",\"SimCardSlot\":\"1\",\"SimCardNumber\":\"\",\"SensorStepCount\":\"1\",\"SensorAccelerator\":\"1\",\"NonMarketAllowed\":\"1\"}","source_action":"0","preload_info":"unknown","source_switch":"0","answer_type":"","user_language":"en","password":"4146bdc0a4c26ee08e8b3f1395322a1c","iso_country_code":"CN","hcm_token":"","api_key":"0be3747aacc670a51a83230bcfe80173","certificatedKey":"9487ba76b32e9e36785fb4c3540021f85af8d7b7","inc_p":"1","fcm_token":"d4_UynwaSwqmtTxInOpLmX:APA91bEWh19tnKhk7d7ke1jhC_m3YGfawi2K6l_7h1mZaJxehD_7MYcwKxzMqciTxqJapPXk1xy-6Y1HMOpj5rby6dwmYJ8-EbJ-snHioz7a8rAOzr5mLEHxgboL9i00OOGaYmSD8sCz","operator":"-1","answer_value":"","question_type":"","clientType":"1","ts":"0","switch_account":"","session_key":"","type":"1"}
        */
        Java.use("com.zing.zalocore.utils.cryptology.CoreUtils").encodeHttpParamsNative.implementation = function(strArg) {
            var result = this.encodeHttpParamsNative(strArg)
            console.log("encodeHttpParamsNative param:", strArg)
            return result
        }
    })
}

function hook_native() {
    var libnative_addr = Module.findBaseAddress(libnative)
    // var sub_49360 = new NativePointer(parseInt(libnative_addr.toString()) + 0x49360)
    // var var_fae30 = new NativePointer(parseInt(libnative_addr.toString()) + 0xfae30)
    // Interceptor.attach(sub_49360, {
    //     onEnter: function() {
    //         console.log("...into sub_49360")
    //     }, onLeave:function(retval) {
    //         console.log("sub_49360 return value:", retval)
    //         var retBytes = new NativePointer(retval)
    //         console.log("sub_49360 return result:", retBytes.readPointer())
    //         console.log(retBytes.readByteArray(0x20))
    //         console.log("var_fae30 return result:")
    //         console.log(var_fae30.readByteArray(0x100))
    //     }
    // })

    var arg0ptr = null
    var arg2ptr = null
    var arg5ptr = null
    var sub_46B10 = new NativePointer(parseInt(libnative_addr.toString()) + 0x46B10)
    var var_F6E30 = new NativePointer(parseInt(libnative_addr.toString()) + 0xF6E30)
    Interceptor.attach(sub_46B10, {
        onEnter: function(args) {
            console.log("var_F6E30:")
            console.log(var_F6E30.readByteArray(0x30))
            // arg2:0123456789ABCDEF
            // java layer's map
            // console.log("...into sub_46B10:", args[0], args[1], args[2], args[3], args[4], args[5])
            // arg0ptr = new NativePointer(args[0])
            // console.log("onEnter sub_46B10 arg0:")
            // console.log(arg0ptr.readByteArray(0x10))
            arg2ptr = new NativePointer(args[2])
            console.log("onEnter sub_46B10 arg2:") 
            console.log(arg2ptr.readByteArray(0x10))
            // console.log("sub_46B10 arg3:", args[3].readCString())
            arg5ptr = new NativePointer(args[5])
            // console.log("onEnter sub_46B10 arg5:")
            // console.log(arg5ptr.readByteArray(0x10))
        }, onLeave:function(retval) {
            // console.log("sub_46B10 onLeave")
            // console.log("onLeave sub_46B10 arg0:")
            // console.log(arg0ptr.readByteArray(0x10))
            console.log("onLeave sub_46B10 arg2:") 
            console.log(arg2ptr.readByteArray(0x10))
            console.log("onLeave sub_46B10 arg5:")
            console.log(arg5ptr.readInt())
        }
    })


    // // 8DC73575341C3093F3F6688564CE2416.gy/CoreUtils;
    // var sub_49738 = new NativePointer(parseInt(libnative_addr.toString()) + 0x49738)
    // Interceptor.attach(sub_49738, {
    //     onEnter: function(args) {
    //         console.log("...into sub_49738:", args[0])
    //     }, onLeave:function(retval) {
    //         console.log("sub_49738 return value:", retval)
    //         var retBytes = new NativePointer(retval)
    //         console.log("sub_49738 return result:")
    //         // 8DC73575341C3093F3F6688564CE2416
    //         console.log(retBytes.readCString())
    //     }
    // })

    // var sub_55F5C = new NativePointer(parseInt(libnative_addr.toString()) + 0x55F5C)
    // var arg3ptr = null
    // var arg1ptr = null
    // Interceptor.attach(sub_55F5C, {
    //     onEnter: function(args) {
    //         console.log("...into sub_55F5C:")
    //         arg3ptr = args[2]
    //         arg1ptr = args[0]
    //         console.log("...arg1: ", args[0].readCString())
    //         console.log("...arg2: ", args[1])
    //         console.log("...arg3: ", args[2].readCString())
    //     }, onLeave:function(retval) {
    //         console.log("sub_55F5C arg1ptr result:", arg1ptr.readCString(), "length:", arg1ptr.toString().length)
    //         console.log("sub_55F5C arg3ptr result:", arg3ptr.readCString(), "length:", arg3ptr.toString().length)
    //     }
    // })

    // var outputPtr = null
    // var sub_44C3C = new NativePointer(parseInt(libnative_addr.toString()) + 0x44C3C)
    // Interceptor.attach(sub_44C3C, {
    //     onEnter: function(args) {
    //         outputPtr = args[0]
    //         console.log("onEnter sub_44C3C output:")
    //         console.log(outputPtr.readByteArray(0x20))
    //     }, onLeave: function(retVal) {
    //         console.log("onLeave sub_44C3C output:")
    //         console.log(outputPtr.readByteArray(0x100))
    //     }
    // })

    // 450E8
    var arg0ptr = null
    var arg1ptr = null
    var arg2ptr = null
    var sub_450E8 = new NativePointer(parseInt(libnative_addr.toString()) + 0x450E8)
    Interceptor.attach(sub_450E8, {
        onEnter: function(args) {
            arg0ptr = args[0]
            arg1ptr = args[1]
            arg2ptr = args[2]
            console.log("onEnter sub_450E8 output:")
            console.log(arg0ptr.readByteArray(0x10))
            console.log(arg1ptr.readByteArray(0x10))
            console.log(arg2ptr.readByteArray(0x10))
        }, onLeave: function(retVal) {
            console.log("onLeave sub_450E8 output:")
            console.log(arg0ptr.readByteArray(0x10))
            console.log(arg1ptr.readByteArray(0x10))
            console.log(arg2ptr.readByteArray(0x10))
        }
    })
}

function hook_native2() {
    var times = 0
    var libnative_addr = Module.findBaseAddress(libnative)
    var sub_450E8 = new NativePointer(parseInt(libnative_addr.toString()) + 0x450E8)
    Interceptor.attach(sub_450E8, {
        onEnter: function(args) {
            console.log("...into sub_450E8:", times++)
        }, onLeave:function(retval) {
        }
    })
}

function main() {
    // hook_java()
    hook_native()
    // hook_native2()
}

setImmediate(main)