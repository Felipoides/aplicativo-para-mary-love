"""Open the real installed mascot screen and capture the Android renderer."""
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image, ImageChops, ImageStat

OUT = Path('diagnostics')
OUT.mkdir(exist_ok=True)

def adb(*args, timeout=30):
    return subprocess.check_output(['adb', *args], timeout=timeout)

def snapshot(name):
    (OUT / f'{name}.png').write_bytes(adb('exec-out', 'screencap', '-p'))

def verify_frame(name):
    time.sleep(5)
    labels = [n.attrib.get('text', '') for n in nodes()]
    if any('3D não carregou' in label for label in labels):
        snapshot(name)
        raise RuntimeError('Viewer entered error fallback: ' + repr(labels))
    snapshot(name)
    im = Image.open(OUT / f'{name}.png').convert('RGB')
    w,h = im.size
    region = im.crop((int(w*.16), int(h*.36), int(w*.84), int(h*.69)))
    if max(ImageStat.Stat(region).stddev) < 20:
        raise RuntimeError(f'{name}: viewport is blank or almost uniform')
    return region

def tap(label):
    for node in nodes():
        if node.attrib.get('text') == label or node.attrib.get('content-desc') == label:
            a,b,c,d = map(int, re.findall(r'\d+', node.attrib['bounds']))
            adb('shell','input','tap',str((a+c)//2),str((b+d)//2))
            return
    raise RuntimeError('Control not found: ' + label)

def nodes():
    adb('shell', 'uiautomator', 'dump', '/sdcard/window.xml')
    xml = adb('shell', 'cat', '/sdcard/window.xml')
    (OUT / 'window.xml').write_bytes(xml)
    return ET.fromstring(xml).iter('node')

try:
    adb('install', '-r', '-g', sys.argv[1], timeout=120)
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
    front = verify_frame('mascots-front')
    for node in nodes():
        print(node.attrib.get('text') or node.attrib.get('content-desc') or '',flush=True)
    adb('shell','input','swipe','800','750','220','750','800')
    rotated = verify_frame('mascots-rotated')
    if sum(ImageStat.Stat(ImageChops.difference(front, rotated)).mean) < 10:
        raise RuntimeError('Dragging did not visibly rotate the models')
    for label in ['Matheus', 'Mary', 'Juntinhos']:
        tap(label)
        verify_frame('selection-' + label)
    tap('Recarregar 3D')
    verify_frame('reloaded')
    adb('shell','input','keyevent','KEYCODE_HOME')
    time.sleep(2)
    adb('shell','am','start','-n','com.felpoinho.paramary/.MainActivity')
    verify_frame('resumed')
    tap('Voltar')
    time.sleep(2)
    for node in nodes():
        if 'Conversar com o mascote' in node.attrib.get('content-desc',''):
            a,b,c,d = map(int,re.findall(r'\d+',node.attrib['bounds']))
            x,y = str((a+c)//2),str((b+d)//2)
            adb('shell','input','swipe',x,y,x,y,'900')
            break
    verify_frame('reopened')
finally:
    logs=adb('logcat','-d','-s','ReactNativeJS:V','ExpoGL:V','AndroidRuntime:E')
    (OUT/'renderer.log').write_bytes(logs)
    print(logs.decode(errors='replace'),flush=True)
