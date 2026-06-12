import sys
from PIL import Image

def process_logo(input_path, output_path, bg_color, tolerance=15):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # Check if the pixel is close to the bg_color
        if (abs(item[0] - bg_color[0]) <= tolerance and
            abs(item[1] - bg_color[1]) <= tolerance and
            abs(item[2] - bg_color[2]) <= tolerance):
            # Make it transparent
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Optional: crop the empty transparent space
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path, "PNG")
    print(f"Saved {output_path}")

    # Generate icons
    # Favicon (32x32)
    fav = img.resize((32, 32), Image.Resampling.LANCZOS)
    fav.save("public/favicon.ico", format="ICO", sizes=[(32, 32)])
    print("Saved public/favicon.ico")

    # Apple Touch Icon (180x180)
    touch = img.resize((180, 180), Image.Resampling.LANCZOS)
    # Add a white background for apple touch icon
    bg = Image.new("RGB", (180, 180), (255, 255, 255))
    bg.paste(touch, (0, 0), touch)
    bg.save("public/apple-touch-icon.png", "PNG")
    print("Saved public/apple-touch-icon.png")

process_logo("/home/dev-lab/Documents/GitHub/MaTax_App/Logo/MATAX_Logo.jpeg", "public/logo.png", (245, 245, 245), 20)
