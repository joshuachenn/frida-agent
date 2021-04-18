function invoke(){
    Java.perform(function(){
        Java.choose("org.joshua.lesson4.MainActivity",{
            onMatch:function(instance){
                console.log("found instance :",instance)
                console.log("found instance :",instance.secret())
            },onComplete:function(){}
        })
    })
}

//setTimeout(invoke,2000)

rpc.exports = {
    invokefunc:invoke
}