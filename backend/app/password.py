import hashlib
password = "admin123"
hash_value = hashlib.sha256(password.encode()).hexdigest()
print(f"New hash: {hash_value}")
exit()