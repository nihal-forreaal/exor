import qrcode
import io

url = "http://192.168.1.15:8080"
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_M,
    box_size=10,
    border=4,
)
qr.add_data(url)
qr.make(fit=True)

img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")

path1 = r"C:\Users\ahamm\.gemini\antigravity\brain\0f3f12f8-26d5-4c65-bbd5-ccf3e6ef2795\mobile-qr.png"
path2 = r"C:\Users\ahamm\.gemini\antigravity\scratch\exor-medical-systems\assets\images\mobile-qr.png"

img.save(path1)
img.save(path2)

f = io.StringIO()
qr.print_ascii(out=f, invert=True)
print(f.getvalue())
