import base64
import sqlite3
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher
from cryptography.hazmat.primitives.ciphers.algorithms import AES
from cryptography.hazmat.primitives.ciphers.modes import CFB8

PADDING = b"}"
IV_SIZE = AES.block_size // 8


def pad(key: bytes) -> bytes:
    key = key[:32]
    if len(key) in (16, 24, 32):
        return key
    return key.ljust(32, PADDING)


def decrypt(ciphertext_b64: str, key: bytes) -> str:
    ciphertext = base64.b64decode(ciphertext_b64)
    iv = ciphertext[:IV_SIZE]
    cipher = Cipher(AES(pad(key)), CFB8(iv), default_backend())
    decryptor = cipher.decryptor()
    return (decryptor.update(ciphertext[IV_SIZE:]) + decryptor.finalize()).decode()


db = sqlite3.connect(r"C:\Users\DELL\AppData\Roaming\pgAdmin\pgadmin4.db")
cur = db.cursor()
cur.execute("SELECT password FROM server WHERE id=1")
enc = cur.fetchone()[0]
cur.execute("SELECT id, username, password, masterpass_check FROM user")
users = cur.fetchall()
print("users:", users)
cur.execute("SELECT * FROM keys")
print("keys:", cur.fetchall())

for uid, username, user_pass, masterpass in users:
    try:
        print(f"try user password for {username}:", decrypt(enc, user_pass.encode()))
    except Exception as e:
        print(f"failed user password for {username}:", e)

try:
    import keyring
    mk = keyring.get_password("pgAdmin4", "pgadmin4-master-password")
    print("keyring master:", mk)
    if mk:
        print("decrypted with keyring:", decrypt(enc, mk.encode()))
except Exception as e:
    print("keyring error:", e)
