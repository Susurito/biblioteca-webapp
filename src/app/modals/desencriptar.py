import os
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.backends import default_backend

# Parámetros idénticos al cifrado
MAGIC = b'ENCV1'
SALT_SIZE = 16
NONCE_SIZE = 12
KDF_ITERATIONS = 200_000

def derive_key(password: bytes, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=KDF_ITERATIONS,
        backend=default_backend()
    )
    return kdf.derive(password)

def try_decrypt(password: str, in_path: str) -> bytes:
    """Intenta descifrar el archivo con la contraseña dada."""
    with open(in_path, 'rb') as f:
        magic = f.read(len(MAGIC))
        if magic != MAGIC:
            raise ValueError("Formato de archivo desconocido")
        salt = f.read(SALT_SIZE)
        nonce = f.read(NONCE_SIZE)
        ciphertext = f.read()

    key = derive_key(password.encode('utf-8'), salt)
    aesgcm = AESGCM(key)

    try:
        plaintext = aesgcm.decrypt(nonce, ciphertext, associated_data=None)
        return plaintext
    except Exception:
        return None

def main():
    archivo_cifrado = "archivo.enc"
    diccionario = "L.txt"

    with open(diccionario, 'r', encoding='utf-8') as f:
        passwords = [line.strip() for line in f if line.strip()]

    for idx, pwd in enumerate(passwords, 1):
        plaintext = try_decrypt(pwd, archivo_cifrado)
        if plaintext is not None:
            print(f"[+] Contraseña encontrada: {pwd}")
            with open("archivo_descifrado.txt", "wb") as out:
                out.write(plaintext)
            print("[+] Archivo descifrado guardado como 'archivo_descifrado.txt'")
            return
        if idx % 100 == 0:
            print(f"[i] Probadas {idx} contraseñas...")

    print("[-] No se encontró la contraseña en el diccionario.")

if __name__ == "__main__":
    main()
