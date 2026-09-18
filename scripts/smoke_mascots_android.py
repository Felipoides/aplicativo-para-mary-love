"""Open the real installed mascot screen and capture the Android renderer."""
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

OUT = Path('diagnostics')
OUT.mkdir(exist_ok=True)

def adb(*args, timeout=30):
    return subprocess.check_output(['adb', *args], timeout=timeout)

def snapshot(name):
    (OUT / f'{name}.png').write_bytes(adb('exec-out', 'screencap', '-p'))

def nodes():
    adb('shell', 'uiautomator', 'dump', '/sdcard/window.xml')
    xml = adb('shell', 'cat', '/sdcard/window.xml')
    (OUT / 'window.xml').write_bytes(xml)
    return ET.fromstring(xml).iter('node')

try:
    adb('install', '-r', sys.argv[1], timeout=120)
    # Keep the synthetic test device from registering with the live Firebase app.
    adb('shell', 'svc', 'wifi', 'disable')
    adb('shell', 'svc', 'data', 'disable')
    adb('logcat', '-c')
    adb('shell', 'am', 'start', '-n', 'com.felpoinho.paramary/.MainActivity')
    time.sleep(10)
    snapshot('home')
    opened = False
    for node in nodes():
        desc = node.attrib.get('content-desc', '')
        if 'Conversar com o mascote' in desc:
            a,b,c,d = map(int,re.findall(r'\d+',node.attrib['bounds']))
            x,y = str((a+c)//2),str((b+d)//2)
            adb('shell','input','swipe',x,y,x,y,'900')
            opened=True
            break
    if not opened:
        raise RuntimeError('Mascot navigation was not found in the installed app')
    time.sleep(12)
    snapshot('mascots-front')
    for node in nodes():
        print(node.attrib.get('text') or node.attrib.get('content-desc') or '',flush=True)
    adb('shell','input','swipe','800','750','220','750','800')
    time.sleep(2)
    snapshot('mascots-rotated')
finally:
    logs=adb('logcat','-d','-s','ReactNativeJS:V','ExpoGL:V','AndroidRuntime:E')
    (OUT/'renderer.log').write_bytes(logs)
    print(logs.decode(errors='replace'),flush=True)
