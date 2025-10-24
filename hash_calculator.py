import hashlib

passwords = [
    "manager123",
    "admin123",
    "moderator123",
    "vice123",
    "member123"
]

print("SHA256 Hashes for passwords:")
print("=" * 80)

for password in passwords:
    hash_value = hashlib.sha256(password.encode()).hexdigest()
    print(f"{password:20} -> {hash_value}")
