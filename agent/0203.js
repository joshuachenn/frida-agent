function main() {
    Java.perform(function() {
        console.log("Inside Frida Java Perform ! ")
    })
}

setImmediate(main)