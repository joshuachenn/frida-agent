import frida
import time
import base64

def my_message_handler(message, payload):
    print(message)
    print(payload)
        

device = frida.get_device_manager().add_remote_device('192.168.0.103:9999')
# device = frida.get_usb_device()
print(device.enumerate_processes())
session = device.attach('org.joshua.lesson4')
with open('lesson7lesson4.js') as f:
    script = session.create_script(f.read())

script.on('message', my_message_handler)
script.load()

command = ''
while True:
    command = input('Enter Command:')
    if command == '1':
        break
    elif command == '2':
        script.exports.invokefunc()
