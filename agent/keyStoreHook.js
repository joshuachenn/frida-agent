const { networkInterfaces } = require("os");

// Android 8.1.0
function hook_keyStore_load() {
    Java.perform(function () {
        var StringClass = Java.use('java.lang.String')
        var keyStoreClass = Java.use('java.security.KeyStore')
        keyStoreClass.load.overload('java.security.KeyStore$LoadStoreParameter').implementation = function(arg0) {
            console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));

            console.log("KeyStore.load1:", arg0);
            this.load(arg0);
        }

        keyStoreClass.load.overload('java.io.InputStream', '[C').implementation = function (arg0, arg1) {
            console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));

            console.log("KeyStore.load2:", arg0, arg1 ? StringClass.$new(arg1) : null);

            // if (arg0){
            //     var file =  Java.use("java.io.File").$new("/sdcard/Download/"+ String(arg0)+".p12");
            //     var out = Java.use("java.io.FileOutputStream").$new(file);
            //     var r;
            //     while( (r = arg0.read(buffer)) > 0){
            //         out.write(buffer,0,r)
            //     }
            //     console.log("save success!")
            //     out.close()
            // }
            this.load(arg0, arg1);
        };

        console.log("hook_KeyStore_load...");
    })
}

// KeyStore.load2: android.content.res.AssetManager$AssetInputStream@85a98a0 }%2R+\OSsjpP!w%X

function hook_checkVPN() {
    Java.perform(function() {
        var StringClass = Java.use('java.lang.String')
        var NetWorkInterface = Java.use('java.net.NetworkInterface')
        networkInterface.getName.implementation = function() {
            var name = this.getName()
            console.log("interface name:", name)
            if (name == 'tun0') {
                var result = StringClass.$new('rmnet_data0')
                return result
            } 
            return name
        }
    })
}

function main() {
    hook_keyStore_load()
}

setImmediate(main)