import inspect
from cascade.cascadeflow import CascadeAgent, HarnessConfig

with open('cascade_doc.txt', 'w', encoding='utf-8') as f:
    try:
        f.write("=== CascadeAgent ===\n")
        f.write(inspect.getsource(CascadeAgent))
        f.write("\n\n=== HarnessConfig ===\n")
        f.write(inspect.getsource(HarnessConfig))
    except Exception as e:
        f.write(f"Error: {e}")
