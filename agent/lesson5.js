function main() {
    Java.perform(function() {
        /*
        Java.use("java.lang.Character").toString.overload('char').implementation = function(x) {
            var result = this.toString(x)
            console.log("x.result", x, result)
            return 'hehe'
        }
        */

    /*
    Java.use('java.util.Array').toString.overload('[C').implementation = function (x) {
        // array type params replacement
        var charArray = Java.array('char', ['一', '去', '二', '三', '里'])
        var result = this.toString(charArray)
        // JSON.stringify(x)
        console.log('x,result', gson.$new().toJson(charArray), result)
        //return result
        // replacing return value with java string instead of javascript string
        return Java.use('java.lang.String').$new("烟村四五家")
    }
    */

    // var WaterHandle = null;
    // Java.choose('com.r0ysue.a0526printout.Water', {
    //     onMatch: function(instance) {
    //         console.log('found instance:', instance)
    //         console.log('water instance call still:', instance.still(instance))
    //         WaterHandle = instance
    //     },
    //     onComplete: function(instance) {
    //         console.log('Search completed!')
    //     }
    // })
    // var JuiceHandle = Java.cast(WaterHandle, Java.use('com.r0ysue.a0526printout.Juice'))
    // console.log('Juice fill energy method: ', JuiceHandle.fillEnergy())

    // var JuiceHandle = null;
    // Java.choose('com.r0ysue.a0526printout.Juice', {
    //     onMatch: function(instance) {
    //         console.log('found instance:', instance)
    //         console.log('water instance call still:', instance.fillEnergy())
    //         JuiceHandle = instance
    //     },
    //     onComplete: function(instance) {
    //         console.log('Search completed!')
    //     }
    // })
    // var WaterHandle = Java.cast(JuiceHandle, Java.use('com.r0ysue.a0526printout.Water'))
    // console.log("water invoke still:", WaterHandle.still(WaterHandle))

    // // abstract interface
    // var abstractClass = Java.use('com.r0ysue.a0526printout.liquid')
    // var beer = Java.registerClass({
    //     name: 'com.r0ysue.a0526printout.beer', // concreate class
    //     implements: [abstractClass],
    //     methods: { 
    //         // interface method to be implements
    //         flow: function() {
    //             console.log('look i\'m beer')
    //             return 'tasty good!'
    //         }
    //     }
    //   });
    //   // use $new() to create an instance and call its interface method
    //   console.log('beer.flow:', beer.$new().flow())

        // //enumeration
        // Java.choose('com.r0ysue.a0526printout.Signal', {
        //     onMatch: function(instance) {
        //         console.log('found instance:', instance)
        //         console.log('invoke getDeclaringClass:', instance.getDeclaringClass())
        //     }, onComplete:function() {console.log('search completed!')}
        // })

    })

    
}

setImmediate(main)

function hashmap888() {
    /*
    Java.perform(function() {
        Java.choose('java.util.HashMap', {
            onMatch: function(instance) {
                // filter
                if (instance.toString().indexOf('ISBN') != 1) {
                    console.log('found HashMap:', instance)
                    console.log('HashMap toString:', instance.toString())
                }
            },
            onComplete: function() {
                console.log('Search Completed!')
            }
        })
    })
    */

    /*
    Java.use('java.util.HashMap').put.implementation = function(x, y) {
        var result = this.put(x, y)
        console.log('x, y, result', x, y. result)
        return result
    }
    */


}

setTimeout(hashmap888, 2000);