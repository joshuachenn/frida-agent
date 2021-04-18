 
function main() {
    Java.perform(function() {
        /*
        Java.use("org.joshua.lesson4.MainActivity").func.implementation = function(arg1, arg2) {
            arg1 = 100
            var result = this.func(100, arg2)
            console.log(100, arg2, result)
            return result
        }
        */

        Java.use("net.sqlcipher.database.SQLiteOpenHelper").getWritableDatabase.overload("java.lang.String").implementation = function(x) {
            var result = this.getWritableDatabase(x)
            console.log("x, result", x, result)
            return result
        }

        Java.use("net.sqlcipher.database.SQLiteOpenHelper").getWritableDatabase.overload("[C").implementation = function(x) {
            var result = this.getWritableDatabase(x)
            console.log("x, result", x, result)
            return result
        }


    })
}

setImmediate(main)


function invoke() {
    Java.perform(function() {
        Java.choose("com.example.yaphetshan.tencentwelcome.MainActivity", {
            onMatch: function(instance) {
                console.log("found instance:", instance)
                console.log("invoke instance.a:", instance.a())
            }, onComplete: function() {
                console.log("search completed!")
            }
        })
    })
}

// delay 3 seconds to invoke invoke function
setTimeout(invoke, 3000);