function main() {
    Java.perform(function() {
        Java.use('com.example.androiddemo.Activity.LoginActivity').a.overload('java.lang.String', 'java.lang.String').implementation = function(x, y) {
            var result = this.a(x, y)
            console.log("x, y, result", x, y,  result)
            return result
        }
    })
}

function first() {
    Java.perform(function() {
        Java.use('com.example.androiddemo.Activity.FridaActivity1').a.implementation = function(x) {
            return Java.use('java.lang.String').$new("R4jSLLLLLLLLLLOrLE7/5B+Z6fsl65yj6BgC6YWz66gO6g2t65Pk6a+P65NK44NNROl0wNOLLLL=")
        }
    })
}

function second() {
    Java.perform(function() {
        Java.use('com.example.androiddemo.Activity.FridaActivity2').setStatic_bool_var()
        Java.choose('com.example.androiddemo.Activity.FridaActivity2', {
            onMatch: function(instance) {
                instance.setBool_var()
            }, onComplete:function(){}
        })
    })
}

function third() {
    Java.perform(function() {
        Java.use('com.example.androiddemo.Activity.FridaActivity3').static_bool_var.value = true
        Java.choose('com.example.androiddemo.Activity.FridaActivity3', {
            onMatch: function(instance) {
                instance.bool_var.value = true
                instance._same_name_bool_var.value = true
            }, onComplete:function(){}
        })
    })
}

function forth() {
    Java.perform(function() {
        Java.use('com.example.androiddemo.Activity.FridaActivity4$InnerClasses').check1.implementation = function() {return true}
        Java.use('com.example.androiddemo.Activity.FridaActivity4$InnerClasses').check2.implementation = function() {return true}
        Java.use('com.example.androiddemo.Activity.FridaActivity4$InnerClasses').check3.implementation = function() {return true}
        Java.use('com.example.androiddemo.Activity.FridaActivity4$InnerClasses').check4.implementation = function() {return true}
        Java.use('com.example.androiddemo.Activity.FridaActivity4$InnerClasses').check5.implementation = function() {return true}
        Java.use('com.example.androiddemo.Activity.FridaActivity4$InnerClasses').check6.implementation = function() {return true}
    })
}

function forth2() {
    Java.perform(function() {
        var class_name = 'com.example.androiddemo.Activity.FridaActivity4$InnerClasses'
        var inner_class = Java.use(class_name)
        var all_methods = inner_class.class.getDeclaredMethods()
        for (var index = 0; index < all_methods.length; index++) {
            var method = all_methods[index];
            var substring = method.toString().substring(method.toString().indexOf(class_name)+class_name.length + 1)
            var finalMethodString = substring.substr(0, substring.indexOf('('))
            // console.log(finalMethodString)
            inner_class[finalMethodString].implementation = function() {return  true}
        }
    })
}

function fifth() {
    Java.perform(function(){
        Java.choose("com.example.androiddemo.Activity.FridaActivity5",{
            onMatch:function(instance){
                console.log("found instance getDynamicDexCheck :",instance.getDynamicDexCheck().$className);
            },onComplete:function(){console.log("search complete!")}
        })
        Java.enumerateClassLoaders({
            onMatch:function(loader){
                try {
                    if(loader.findClass("com.example.androiddemo.Dynamic.DynamicCheck")){
                        console.log("Succefully found loader!",loader);
                        Java.classFactory.loader = loader;
                    }
                } catch (error) {
                    console.log("found error "+error)
                    
                }
            },onComplete:function(){"enum completed!"}
        })
        Java.use("com.example.androiddemo.Dynamic.DynamicCheck").check.implementation = function(){return true};
    })
}



setImmediate(forth2)