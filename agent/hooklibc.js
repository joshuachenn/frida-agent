function hook_libc() {
    var mmap_export = Module.findExportByName("libc.so", "mmap")

    console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    console.log("exports:", JSON.stringify(mmap_export))
}

function main() {
    hook_libc()
}

setImmediate(main)