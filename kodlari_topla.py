#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tum_kodlar.txt güncelleyici
Proje kök dizininde çalıştır: python kodlari_topla.py
"""

import os

OUTPUT_FILE = "tum_kodlar.txt"

# Atlanacak klasörler
SKIP_DIRS = {
    "node_modules", ".git", "__pycache__",
    "dist", "build", ".next", "venv", ".venv"
}

# Dahil edilecek uzantılar
INCLUDE_EXTENSIONS = {
    ".js", ".jsx", ".ts", ".tsx",
    ".py", ".css", ".html",
    ".json", ".md", ".toml",
    ".env.example", ".gitignore"
}

# Atlanacak dosyalar
SKIP_FILES = {
    "tum_kodlar.txt",
    "package-lock.json",
    "yarn.lock",
    "kodlari_topla.py",
    "kodlari_topla.bat",
}

def should_skip_dir(dirname):
    return dirname in SKIP_DIRS or dirname.startswith(".")

def should_include_file(filename):
    if filename in SKIP_FILES:
        return False
    _, ext = os.path.splitext(filename)
    # .gitignore gibi uzantısız özel dosyalar
    if filename in {".gitignore", ".env.example"}:
        return True
    return ext.lower() in INCLUDE_EXTENSIONS

def collect_files():
    root = os.getcwd()
    collected = []

    for dirpath, dirnames, filenames in os.walk(root):
        # Atlanacak klasörleri listeden çıkar (in-place)
        dirnames[:] = [d for d in dirnames if not should_skip_dir(d)]

        for filename in sorted(filenames):
            if should_include_file(filename):
                full_path = os.path.join(dirpath, filename)
                rel_path = os.path.relpath(full_path, root)
                collected.append((rel_path, full_path))

    return collected

def main():
    files = collect_files()
    total = 0

    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        out.write(f"# PROJE KOD DÖKÜMÜ\n")
        out.write(f"# Toplam {len(files)} dosya\n")
        out.write("=" * 64 + "\n\n")

        for rel_path, full_path in files:
            try:
                with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
                out.write(f"\n{'=' * 64}\n")
                out.write(f"DOSYA: {rel_path}\n")
                out.write(f"{'=' * 64}\n")
                out.write(content)
                out.write("\n")
                total += 1
                print(f"  ✓ {rel_path}")
            except Exception as e:
                print(f"  ✗ {rel_path} → {e}")

    print(f"\n✅ Tamamlandı! {total} dosya → {OUTPUT_FILE}")
    size = os.path.getsize(OUTPUT_FILE)
    print(f"   Dosya boyutu: {size:,} byte ({size // 1024} KB)")

if __name__ == "__main__":
    main()