"""
Simple in-memory cache utility for performance optimization.
Replace with Redis or other distributed cache for production.
"""
import time
from functools import wraps

class SimpleCache:
    def __init__(self):
        self.cache = {}

    def get(self, key):
        entry = self.cache.get(key)
        if entry and (entry['expires_at'] is None or entry['expires_at'] > time.time()):
            return entry['value']
        return None

    def set(self, key, value, ttl=None):
        expires_at = time.time() + ttl if ttl else None
        self.cache[key] = {'value': value, 'expires_at': expires_at}

    def cache_result(self, ttl=60):
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                key = f"{func.__name__}:{args}:{kwargs}"
                cached = self.get(key)
                if cached is not None:
                    return cached
                result = func(*args, **kwargs)
                self.set(key, result, ttl)
                return result
            return wrapper
        return decorator

cache = SimpleCache()
