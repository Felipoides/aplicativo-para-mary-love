"""Archive-only builder for the previous 2.5D relief prototypes."""
from __future__ import annotations

import json
import struct
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/mascots/conceito-aprovado.png'
OUTPUT = ROOT / 'assets/mascots/legacy-relief'
OUTPUT.mkdir(parents=True, exist_ok=True)


def pad4(data: bytes, pad: bytes = b'\0') -> bytes:
    return data + pad * ((-len(data)) % 4)


def export_glb(path: Path, name: str, verts: np.ndarray, tex: np.ndarray,
               indices: np.ndarray, png: bytes):
    pos = verts.astype('<f4').tobytes()
    uv = tex.astype('<f4').tobytes()
    idx = indices.astype('<u4').tobytes()
    binary = bytearray()
    views = []
    for data, target in [(pos, 34962), (uv, 34962), (idx, 34963), (png, None)]:
        offset = len(binary)
        binary.extend(pad4(data))
        view = {'buffer': 0, 'byteOffset': offset, 'byteLength': len(data)}
        if target:
            view['target'] = target
        views.append(view)
    document = {
        'asset': {'version': '2.0', 'generator': 'Mary Love mascot relief prototype'},
        'scene': 0,
        'scenes': [{'nodes': [0]}],
        'nodes': [{'name': name, 'mesh': 0}],
        'meshes': [{'name': name, 'primitives': [{
            'attributes': {'POSITION': 0, 'TEXCOORD_0': 1}, 'indices': 2,
            'material': 0, 'mode': 4,
        }]}],
        'materials': [{'name': 'Mascot art', 'pbrMetallicRoughness': {
            'baseColorTexture': {'index': 0}, 'metallicFactor': 0,
            'roughnessFactor': 0.95}, 'alphaMode': 'MASK',
            'alphaCutoff': 0.15, 'doubleSided': True}],
        'textures': [{'sampler': 0, 'source': 0}],
        'samplers': [{'magFilter': 9729, 'minFilter': 9987,
                      'wrapS': 33071, 'wrapT': 33071}],
        'images': [{'mimeType': 'image/png', 'bufferView': 3}],
        'buffers': [{'byteLength': len(binary)}],
        'bufferViews': views,
        'accessors': [
            {'bufferView': 0, 'componentType': 5126, 'count': len(verts),
             'type': 'VEC3', 'min': verts.min(0).tolist(),
             'max': verts.max(0).tolist()},
            {'bufferView': 1, 'componentType': 5126, 'count': len(tex),
             'type': 'VEC2'},
            {'bufferView': 2, 'componentType': 5125,
             'count': indices.size, 'type': 'SCALAR'},
        ],
    }
    j = pad4(json.dumps(document, separators=(',', ':')).encode(), b' ')
    b = pad4(bytes(binary))
    path.write_bytes(struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(j) + 8 + len(b))
                     + struct.pack('<I4s', len(j), b'JSON') + j
                     + struct.pack('<I4s', len(b), b'BIN\0') + b)


def make(name: str, box: tuple[int, int, int, int]):
    original = Image.open(SOURCE).convert('RGB').crop(box)
    w0, h0 = original.size
    # Keep the geometry modest enough to render on midrange mobile devices.
    w = round(w0 * min(180 / w0, 260 / h0))
    h = round(h0 * min(180 / w0, 260 / h0))
    rgb = np.asarray(original.resize((w, h), Image.Resampling.LANCZOS))
    # The black backdrop is separate from the character; preserve interior
    # black eyes/shirt by filling holes of the single largest silhouette.
    light = rgb.max(axis=2) > 19
    light = ndi.binary_closing(light, structure=np.ones((3, 3)), iterations=2)
    labels, count = ndi.label(light)
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    mask = labels == sizes.argmax()
    mask = ndi.binary_fill_holes(mask)
    mask = ndi.binary_closing(mask, structure=np.ones((3, 3)), iterations=1)
    mask = ndi.binary_fill_holes(mask)
    # The entire graphic keeps its exact UV layout, with transparent exterior.
    rgba = np.dstack([rgb, np.uint8(mask) * 255])
    png_path = OUTPUT / (name + '-textura.png')
    Image.fromarray(rgba, 'RGBA').save(png_path, optimize=True)

    # Relief mesh: each retained image pixel becomes a two-sided textured
    # quadrilateral. The distance field gives a soft round front and back.
    distance = ndi.distance_transform_edt(mask).astype(np.float32)
    padded = np.pad(distance, 1, mode='constant')
    corners = (padded[:-1, :-1] + padded[1:, :-1]
               + padded[:-1, 1:] + padded[1:, 1:]) / 4
    corners = np.maximum(corners - 1, 0)
    corners = np.sqrt(np.minimum(corners / 34, 1))
    xy_scale = 2.6 / h
    vertices, texture, tris = [], [], []
    vertex_ids = {}

    def vertex(x: int, y: int, front: bool):
        key = (x, y, front)
        if key not in vertex_ids:
            z = (0.042 + 0.19 * corners[y, x]) if front else (-0.055 - 0.14 * corners[y, x])
            vertex_ids[key] = len(vertices)
            vertices.append(((x - w / 2) * xy_scale,
                             (h - y) * xy_scale, float(z)))
            # glTF UV origin is the top-left of the PNG; flipY stays false.
            texture.append((x / w, y / h))
        return vertex_ids[key]

    for y in range(h):
        for x in range(w):
            if not mask[y, x]:
                continue
            a, b = vertex(x, y, True), vertex(x + 1, y, True)
            c, d = vertex(x + 1, y + 1, True), vertex(x, y + 1, True)
            A, B = vertex(x, y, False), vertex(x + 1, y, False)
            C, D = vertex(x + 1, y + 1, False), vertex(x, y + 1, False)
            tris.extend(((a, d, b), (b, d, c), (A, B, D), (B, C, D)))
            if y == 0 or not mask[y - 1, x]:
                tris.extend(((a, b, A), (b, B, A)))
            if x == w - 1 or not mask[y, x + 1]:
                tris.extend(((b, c, B), (c, C, B)))
            if y == h - 1 or not mask[y + 1, x]:
                tris.extend(((c, d, C), (d, D, C)))
            if x == 0 or not mask[y, x - 1]:
                tris.extend(((d, a, D), (a, A, D)))

    verts = np.asarray(vertices, dtype=np.float32)
    uv = np.asarray(texture, dtype=np.float32)
    faces = np.asarray(tris, dtype=np.uint32)
    export_glb(OUTPUT / (name + '.glb'), name, verts, uv, faces, png_path.read_bytes())
    print(name, 'size', w, h, 'pixels', int(mask.sum()), 'verts', len(verts), 'faces', len(faces))


make('Matheus', (78, 135, 605, 1196))
make('Maryane', (584, 211, 1180, 1194))
