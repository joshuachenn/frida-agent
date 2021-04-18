import frida
import time
import base64

def my_message_handler(message, payload):
    print(message)
    print(payload)
    if message['type'] == 'send':
        print(message['payload'])
        data = message['payload'].split(':')[1].strip()
        print('message:', message)
        data = str(base64.b64decode(data))
        usr,pw = data.split(":")
        print('usr,pw:', usr, pw)
        data = str(base64.b64encode(('admin'+':'+pw).encode()))
        print('encode data:', data)
        script.post({'my_data':data})
        print('Modified data sent!')


device = frida.get_device_manager().add_remote_device('192.168.0.103:9999')
# device = frida.get_usb_device()
session = device.attach('com.example.lesson7sec')

with open('lesson7.js') as f:
    script = session.create_script(f.read())

script.on('message', my_message_handler)
script.load()

input()


