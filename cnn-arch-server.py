#!/usr/bin/env python3
"""
cnn-arch-server.py — Backend ringan untuk visualisasi CNN
Jalankan: python3 cnn-arch-server.py
Endpoint: POST /process  (upload gambar + nama arsitektur)
          GET  /architectures  (daftar arsitektur + layer info)

Requirements: pip install flask flask-cors pillow numpy torch torchvision
Fallback (tanpa torch): pip install flask flask-cors pillow numpy
"""

import io
import json
import base64
import numpy as np
from pathlib import Path

try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    from PIL import Image
    HAS_FLASK = True
except ImportError:
    HAS_FLASK = False
    print("⚠  Flask tidak terinstall. Jalankan: pip install flask flask-cors pillow numpy")

try:
    import torch
    import torch.nn as nn
    import torchvision.transforms as T
    import torchvision.models as models
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    print("⚠  PyTorch tidak terinstall. Fallback ke NumPy convolution.")
    print("   Install: pip install torch torchvision")

# ── Fallback NumPy convolution ───────────────────────────────────
import struct

def conv2d_np(img_gray, kernel):
    """2D convolution menggunakan NumPy (tanpa torch)."""
    h, w = img_gray.shape
    kh, kw = kernel.shape
    ph, pw = kh // 2, kw // 2
    padded = np.pad(img_gray, ((ph, ph), (pw, pw)), mode='edge')
    out = np.zeros_like(img_gray, dtype=np.float32)
    for y in range(h):
        for x in range(w):
            out[y, x] = (padded[y:y+kh, x:x+kw] * kernel).sum()
    return out

def relu_np(x):
    return np.maximum(0, x)

def maxpool_np(x, size=2, stride=2):
    h, w = x.shape
    nh = (h - size) // stride + 1
    nw = (w - size) // stride + 1
    out = np.zeros((nh, nw), dtype=np.float32)
    for y in range(nh):
        for x_ in range(nw):
            out[y, x_] = x[y*stride:y*stride+size, x_*stride:x_*stride+size].max()
    return out

# ── Predefined kernels ────────────────────────────────────────────
KERNELS = {
    'sobel_x':   np.array([[-1,0,1],[-2,0,2],[-1,0,1]], dtype=np.float32),
    'sobel_y':   np.array([[-1,-2,-1],[0,0,0],[1,2,1]], dtype=np.float32),
    'laplacian': np.array([[0,-1,0],[-1,4,-1],[0,-1,0]], dtype=np.float32),
    'sharpen':   np.array([[0,-1,0],[-1,5,-1],[0,-1,0]], dtype=np.float32),
    'blur':      np.ones((3,3), dtype=np.float32) / 9,
    'emboss':    np.array([[-2,-1,0],[-1,1,1],[0,1,2]], dtype=np.float32),
    'edge_diag': np.array([[-1,-1,2],[-1,2,-1],[2,-1,-1]], dtype=np.float32),
    'edge_all':  np.array([[1,1,1],[1,-8,1],[1,1,1]], dtype=np.float32),
}

def fm_to_png_b64(arr):
    """Normalize float array → PNG base64 string."""
    mn, mx = arr.min(), arr.max()
    rng = mx - mn if mx != mn else 1.0
    norm = ((arr - mn) / rng * 255).clip(0, 255).astype(np.uint8)
    img = Image.fromarray(norm, mode='L')
    buf = io.BytesIO()
    img.save(buf, format='PNG', optimize=True)
    return base64.b64encode(buf.getvalue()).decode()

def process_numpy(img_array):
    """
    Simulasikan pipeline CNN dengan NumPy.
    img_array: H×W×3 uint8
    Returns: list of {name, shape, maps: [base64_png, ...], desc}
    """
    gray = img_array.mean(axis=2).astype(np.float32) / 255.0  # grayscale
    # resize to 64×64 for speed
    pil = Image.fromarray((gray * 255).astype(np.uint8))
    pil = pil.resize((64, 64), Image.LANCZOS)
    gray64 = np.array(pil).astype(np.float32) / 255.0

    steps = []

    # Input
    steps.append({
        'name': 'Input (grayscale)',
        'shape': f'{img_array.shape[1]}×{img_array.shape[0]}×3 → 64×64×1',
        'maps': [fm_to_png_b64(gray64)],
        'desc': 'Gambar asli di-convert ke grayscale dan di-resize ke 64×64 untuk visualisasi.'
    })

    # Layer 1: multiple convolutions
    k_names = ['sobel_x', 'sobel_y', 'laplacian', 'sharpen', 'blur', 'emboss', 'edge_diag', 'edge_all']
    conv1 = [relu_np(conv2d_np(gray64, KERNELS[k])) for k in k_names]
    steps.append({
        'name': 'Conv 3×3 + ReLU (8 filters)',
        'shape': '64×64×8',
        'maps': [fm_to_png_b64(m) for m in conv1],
        'desc': '8 filter berbeda: Sobel XY (edge), Laplacian, Sharpen, Blur, Emboss, Edge diagonal. ReLU mematikan aktivasi negatif.',
        'filter_names': k_names
    })

    # Pool 1
    pool1 = [maxpool_np(m, 2, 2) for m in conv1]
    steps.append({
        'name': 'MaxPool 2×2',
        'shape': '32×32×8',
        'maps': [fm_to_png_b64(m) for m in pool1],
        'desc': 'MaxPool mengurangi resolusi 2×. Satu sel di feature map kini merepresentasikan 2×2 piksel input.'
    })

    # Layer 2: apply random subset of kernels to each channel
    conv2 = []
    for m in pool1[:4]:
        for k in ['sobel_x', 'laplacian', 'sharpen']:
            conv2.append(relu_np(conv2d_np(m, KERNELS[k])))
    steps.append({
        'name': 'Conv 3×3 + ReLU (12 filters)',
        'shape': '32×32×12',
        'maps': [fm_to_png_b64(m) for m in conv2],
        'desc': 'Layer kedua menggabungkan fitur dari layer sebelumnya. Pola lebih kompleks (kombinasi edges) mulai muncul.'
    })

    # Pool 2
    pool2 = [maxpool_np(m, 2, 2) for m in conv2]
    steps.append({
        'name': 'MaxPool 2×2',
        'shape': '16×16×12',
        'maps': [fm_to_png_b64(m) for m in pool2],
        'desc': 'Receptive field efektif kini 8×8 piksel dari gambar asli. Informasi spasial mulai terabstraksi.'
    })

    # Layer 3
    conv3 = []
    for m in pool2[:6]:
        for k in ['edge_all', 'laplacian']:
            conv3.append(relu_np(conv2d_np(m, KERNELS[k])))
    steps.append({
        'name': 'Conv 3×3 + ReLU (12 filters)',
        'shape': '16×16×12',
        'maps': [fm_to_png_b64(m) for m in conv3],
        'desc': 'Fitur abstrak tingkat tinggi. Kombinasi edge dari berbagai sudut membentuk representasi objek.'
    })

    # Pool 3
    pool3 = [maxpool_np(m, 2, 2) for m in conv3]
    steps.append({
        'name': 'MaxPool 2×2',
        'shape': '8×8×12',
        'maps': [fm_to_png_b64(m) for m in pool3],
        'desc': 'Feature map kecil dengan representasi kaya. Receptive field ~32×32 dari gambar asli.'
    })

    # GAP
    gap = [float(m.mean()) for m in pool3]
    steps.append({
        'name': 'Global Average Pooling',
        'shape': '1×1×12 → vektor 12',
        'gap_vals': gap,
        'maps': [],
        'desc': 'GAP merata-ratakan setiap feature map menjadi satu nilai. Output: vektor 12 dimensi siap masuk FC layer.'
    })

    return steps


def process_torch(img_pil, arch_name):
    """
    Proses gambar menggunakan pretrained PyTorch model dengan hook.
    Ekstrak feature map aktual dari setiap layer.
    """
    device = 'cpu'

    # Load model
    if arch_name == 'alexnet':
        model = models.alexnet(weights=models.AlexNet_Weights.DEFAULT)
        layer_names = ['features.0','features.3','features.6','features.8','features.10']
    elif arch_name == 'vgg16':
        model = models.vgg16(weights=models.VGG16_Weights.DEFAULT)
        layer_names = ['features.4','features.9','features.16','features.23','features.30']
    elif arch_name == 'resnet50':
        model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
        layer_names = ['layer1','layer2','layer3','layer4','avgpool']
    elif arch_name == 'efficientb0':
        model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
        layer_names = ['features.0','features.1','features.2','features.4','features.6']
    else:
        model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
        layer_names = ['layer1','layer2','layer3','layer4','avgpool']

    model.eval().to(device)

    # Preprocess
    transform = T.Compose([
        T.Resize(224),
        T.CenterCrop(224),
        T.ToTensor(),
        T.Normalize(mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225]),
    ])
    tensor = transform(img_pil).unsqueeze(0).to(device)

    # Register hooks
    activations = {}
    hooks = []

    def make_hook(name):
        def hook(module, inp, out):
            activations[name] = out.detach().cpu()
        return hook

    for lname in layer_names:
        parts = lname.split('.')
        layer = model
        for p in parts:
            layer = getattr(layer, p, None)
            if layer is None: break
        if layer:
            hooks.append(layer.register_forward_hook(make_hook(lname)))

    with torch.no_grad():
        model(tensor)

    for h in hooks:
        h.remove()

    steps = []
    # Input step
    inp_arr = (tensor.squeeze().permute(1,2,0).numpy() * np.array([0.229,0.224,0.225]) + np.array([0.485,0.456,0.406]))
    inp_gray = inp_arr.mean(axis=2)
    steps.append({
        'name': 'Input',
        'shape': '224×224×3',
        'maps': [fm_to_png_b64(inp_gray)],
        'desc': 'Gambar asli setelah normalisasi ImageNet (mean subtract, std divide).'
    })

    for lname in layer_names:
        if lname not in activations:
            continue
        act = activations[lname]
        # act shape: 1 × C × H × W  or 1 × C × 1 × 1
        act = act.squeeze(0)  # C × H × W
        if act.dim() == 1:
            # GAP output
            steps.append({
                'name': f'{lname} (GAP)',
                'shape': f'1×1×{act.shape[0]}',
                'gap_vals': act[:16].tolist(),
                'maps': [],
                'desc': f'Global Average Pool output — vektor {act.shape[0]} dimensi.'
            })
        else:
            C, H, W = act.shape
            n_show = min(16, C)
            maps_b64 = []
            for i in range(n_show):
                fm = act[i].numpy()
                maps_b64.append(fm_to_png_b64(fm))
            steps.append({
                'name': lname,
                'shape': f'{H}×{W}×{C}',
                'maps': maps_b64,
                'desc': f'Feature maps dari layer {lname}. Menampilkan {n_show} dari {C} channel.'
            })

    return steps


# ── Flask app ─────────────────────────────────────────────────────
if HAS_FLASK:
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    @app.route('/architectures', methods=['GET'])
    def get_architectures():
        return jsonify({
            'architectures': [
                {'id':'alexnet',     'name':'AlexNet',        'layers':8,  'params':'60M'},
                {'id':'vgg16',       'name':'VGG-16',         'layers':16, 'params':'138M'},
                {'id':'resnet50',    'name':'ResNet-50',      'layers':50, 'params':'25.6M'},
                {'id':'efficientb0', 'name':'EfficientNet-B0','layers':82, 'params':'5.3M'},
            ],
            'has_torch': HAS_TORCH
        })

    @app.route('/process', methods=['POST'])
    def process_image():
        try:
            # Get image
            if 'image' not in request.files:
                return jsonify({'error': 'No image provided'}), 400

            file    = request.files['image']
            arch    = request.form.get('arch', 'resnet50')
            use_torch = request.form.get('use_torch', 'true').lower() == 'true'

            img_bytes = file.read()
            img_pil   = Image.open(io.BytesIO(img_bytes)).convert('RGB')

            if HAS_TORCH and use_torch:
                steps = process_torch(img_pil, arch)
            else:
                img_arr = np.array(img_pil)
                steps   = process_numpy(img_arr)

            return jsonify({
                'success': True,
                'arch': arch,
                'backend': 'pytorch' if (HAS_TORCH and use_torch) else 'numpy',
                'steps': steps,
            })

        except Exception as e:
            import traceback
            return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500

    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({'status':'ok','has_torch':HAS_TORCH,'has_flask':HAS_FLASK})

    if __name__ == '__main__':
        print('\n' + '═'*52)
        print('  CNN Architecture Visualizer — Backend Server')
        print('═'*52)
        print(f'  PyTorch: {"✓ tersedia" if HAS_TORCH else "✗ tidak terinstall (fallback NumPy)"}')
        print(f'  Flask:   ✓ tersedia')
        print()
        print('  Endpoint:')
        print('    GET  http://localhost:5050/architectures')
        print('    POST http://localhost:5050/process')
        print('    GET  http://localhost:5050/health')
        print()
        print('  Install dependencies:')
        print('    pip install flask flask-cors pillow numpy')
        if not HAS_TORCH:
            print('    pip install torch torchvision  (opsional, untuk feature map nyata)')
        print('═'*52 + '\n')
        app.run(host='0.0.0.0', port=5050, debug=False)

else:
    print('\nInstall dependencies:')
    print('  pip install flask flask-cors pillow numpy')
    print('  pip install torch torchvision  (opsional)')
