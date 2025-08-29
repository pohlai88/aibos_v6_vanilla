"""
Plug-in/Extension Loader for AI-BOS
----------------------------------

This module enables dynamic loading and registration of third-party and customer-specific extensions.

How to use:
- Place extension modules in the 'extensions' directory.
- Each extension must define a 'register_extension(app)' function.
- On startup, the loader will import and register all extensions.

Example extension:
# extensions/my_custom_extension.py

def register_extension(app):
    @app.get("/custom/hello")
    def hello():
        return {"msg": "Hello from custom extension!"}

"""
import importlib
import os
from fastapi import FastAPI

EXTENSIONS_DIR = os.path.join(os.path.dirname(__file__), "extensions")

def load_extensions(app: FastAPI):
    if not os.path.exists(EXTENSIONS_DIR):
        return
    for fname in os.listdir(EXTENSIONS_DIR):
        if fname.endswith(".py") and not fname.startswith("__"):
            mod_name = f"packages.modules.ledger.api.extensions.{fname[:-3]}"
            mod = importlib.import_module(mod_name)
            if hasattr(mod, "register_extension"):
                mod.register_extension(app)
