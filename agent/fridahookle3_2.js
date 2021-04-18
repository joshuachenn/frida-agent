function hook_okhttp3() {
    Java.perform(function () {

        Java.openClassFile("/data/local/tmp/classes2.dex").load();
        var MyInterceptor = Java.use("org.joshua.interceptor.okhttp3Logging");

        var MyInterceptorObj = MyInterceptor.$new();
        var Builder = Java.use("okhttp3.OkHttpClient$Builder");
        console.log(Builder);
        Builder.build.implementation = function () {
            this.interceptors().add(MyInterceptorObj);
            return this.build();
        };


        console.log("hook_okhttp3...");
    });
}

hook_okhttp3();