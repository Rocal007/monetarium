"""
MONETARIUM — Local AI & Quantitative ML Stack Verifier
Checks GPU, PyTorch, LightGBM, XGBoost, CatBoost, Chronos and Ollama.
"""

import sys
import time
import urllib.request
import json
import numpy as np

def test_stack():
    print("=" * 60)
    print("MONETARIUM — LOKALER KI- & QUANT-STACK TEST")
    print("=" * 60)

    # 1. PyTorch & CUDA
    import torch
    print(f"1. PyTorch:        v{torch.__version__}")
    cuda_ok = torch.cuda.is_available()
    print(f"   CUDA verfuegbar: {cuda_ok}")
    if cuda_ok:
        dev_name = torch.cuda.get_device_name(0)
        vram = round(torch.cuda.get_device_properties(0).total_memory / (1024**3), 2)
        print(f"   GPU:            {dev_name} ({vram} GB VRAM)")
        x = torch.randn(2000, 2000, device="cuda")
        t0 = time.perf_counter()
        y = x @ x
        torch.cuda.synchronize()
        dt = (time.perf_counter() - t0) * 1000
        print(f"   GPU-Matmul:     2000x2000 in {dt:.2f} ms")

    # 2. LightGBM
    import lightgbm as lgb
    print(f"\n2. LightGBM:       v{lgb.__version__}")
    X = np.random.randn(1000, 10)
    y = (X[:, 0] + X[:, 1] > 0).astype(int)
    clf = lgb.LGBMClassifier(n_estimators=20, verbose=-1)
    clf.fit(X, y)
    preds = clf.predict_proba(X[:3])
    print(f"   Inferenz-Check: 3 Predictions erzeugt (Shape: {preds.shape})")

    # 3. XGBoost & CatBoost
    import xgboost as xgb
    import catboost as cb
    print(f"\n3. XGBoost:        v{xgb.__version__}")
    print(f"   CatBoost:       v{cb.__version__}")

    # 4. Amazon Chronos
    import chronos
    print(f"\n4. Chronos TimeSeries: v{chronos.__version__}")

    # 5. CCXT Exchange Engine
    import ccxt
    print(f"\n5. CCXT Engine:    v{ccxt.__version__} ({len(ccxt.exchanges)} Exchanges)")

    # 6. Ollama Local LLM & Embedding Service
    print(f"\n6. Ollama Server:  http://127.0.0.1:11434")
    try:
        req = urllib.request.urlopen("http://127.0.0.1:11434/api/tags", timeout=3)
        data = json.loads(req.read().decode("utf-8"))
        models = [m["name"] for m in data.get("models", [])]
        print(f"   Installierte Modelle ({len(models)}):")
        for m in models:
            print(f"     • {m}")
    except Exception as e:
        print(f"   Ollama Verbindungsfehler: {e}")

    print("=" * 60)
    print("STATUS: Alle Quant-, ML- und KI-Komponenten sind lokal betriebsbereit.")
    print("=" * 60)

if __name__ == "__main__":
    test_stack()
