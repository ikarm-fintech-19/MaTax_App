from PIL import Image
img = Image.open("/home/dev-lab/Documents/GitHub/MaTax_App/Logo/MATAX_Logo.jpeg")
print("Format:", img.format)
print("Size:", img.size)
print("Mode:", img.mode)
corners = [
    img.getpixel((0, 0)),
    img.getpixel((img.width - 1, 0)),
    img.getpixel((0, img.height - 1)),
    img.getpixel((img.width - 1, img.height - 1))
]
print("Corners:", corners)
