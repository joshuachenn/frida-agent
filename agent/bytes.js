// 打印字节数组
function printByteArray(byteArray){
	Java.perform(function(){
		var ByteString = Java.use("com.android.okhttp.okio.ByteString");
		console.log(ByteString.of(byteArray).hex())
	})
}

// 如果上面方法不行，则使用下面方法强转后打印
function printByteArray2(byteArray) {
    var JavaString = Java.use("java.lang.String");
    var JavaByte = Java.use("[B");
    var arr = Java.use("java.util.Arrays");

    var buffer = Java.cast(byteArray,JavaByte);
    var result = Java.array('byte', buffer);
    console.log('byteArray:', JSON.stringify(result))
}
