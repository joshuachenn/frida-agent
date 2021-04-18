Java.perform(function() {
    Java.use('android.widget.TextView').setText.overload('java.lang.CharSequence').implementation = function(x) {
        var string_to_send_x = x.toString()
        var string_to_recv;
        send(string_to_send_x)
        recv(function(received_json_objection){
            string_to_recv = received_json_objection.my_data
            console.log('string_to_recv:'+string_to_recv)
        }).wait()

        var javaStringToSend = Java.use('java.lang.String').$new(string_to_recv)

        var result = this.setText(javaStringToSend)
        return result
    }
})