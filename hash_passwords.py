import hashlib

passwords = [
    "manager123",
    "admin123",
    "member123"
]

print("SHA256 Password Hashes:\n")
for password in passwords:
    hash_result = hashlib.sha256(password.encode()).hexdigest()
    print(f'"{password}" -> {hash_result}')
