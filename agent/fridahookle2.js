function intentHooking() {
    Java.perform(function() {
        var Activity = Java.use('android.app.Activity')
        Activity.startActivity.overload('android.content.intent').implementation = function(p1) {
            console.log('Hooking android.app.Activity.startActivity(p1) successfully, p1='+p1)
            console.log(decodeURIComponent(p1.toUri(256)))
            this.startActivity(p1)
        }
        Activity.startActivity.overload('android.content.Intent', 'android.os.Bundle').implementation=function(p1,p2){
            console.log("Hooking android.app.Activity.startActivity(p1,p2) successfully,p1="+p1+",p2="+p2);
            //console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
            console.log(decodeURIComponent(p1.toUri(256)));
            this.startActivity(p1,p2);
        }
        Activity.startService.overload('android.content.Intent').implementation=function(p1){
            console.log("Hooking android.app.Activity.startService(p1) successfully,p1="+p1);
            //console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
            console.log(decodeURIComponent(p1.toUri(256)));
            this.startService(p1);
        }
    })
}

var jclazz = null;
var jobj = null;

function getObjClassName(obj) {
    if (!jclazz) {
        var jclazz = Java.use("java.lang.Class");
    }
    if (!jobj) {
        var jobj = Java.use("java.lang.Object");
    }
    return jclazz.getName.call(jobj.getClass.call(obj));
}

function watch(obj, mtdName) {
    var listener_name = getObjClassName(obj);
    var target = Java.use(listener_name);
    if (!target || !mtdName in target) {
        return;
    }
    // send("[WatchEvent] hooking " + mtdName + ": " + listener_name);
    target[mtdName].overloads.forEach(function (overload) {
        overload.implementation = function () {
            //send("[WatchEvent] " + mtdName + ": " + getObjClassName(this));
            console.log("[WatchEvent] " + mtdName + ": " + getObjClassName(this))
            return this[mtdName].apply(this, arguments);
        };
    })
}

function OnClickListener() {
    Java.perform(function () {

        //以spawn启动进程的模式来attach的话
        Java.use("android.view.View").setOnClickListener.implementation = function (listener) {
            if (listener != null) {
                watch(listener, 'onClick');
            }
            return this.setOnClickListener(listener);
        };

        //如果frida以attach的模式进行attch的话
        Java.choose("android.view.View$ListenerInfo", {
            onMatch: function (instance) {
                instance = instance.mOnClickListener.value;
                if (instance) {
                    console.log("mOnClickListener name is :" + getObjClassName(instance));
                    watch(instance, 'onClick');
                }
            },
            onComplete: function () {
            }
        })
    })
}
setImmediate(OnClickListener);