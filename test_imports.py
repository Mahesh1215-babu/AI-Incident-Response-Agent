import sys
sys.path.insert(0, ".")
try:
    import backend.main
    print("All imports OK")
except Exception as e:
    print(f"Import error: {e}")
    import traceback
    traceback.print_exc()
