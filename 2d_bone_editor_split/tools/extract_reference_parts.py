from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT / "part_templates" / "reference"
OUTPUT = ROOT / "part_templates" / "examples"


def crop_alpha(image, box):
    part = image.crop(box)
    alpha = part.getchannel("A")
    bounds = alpha.getbbox()
    return part.crop(bounds) if bounds else part


def fit(part, width, height, pixel=False):
    scale = min(width / part.width, height / part.height)
    size = (max(1, round(part.width * scale)), max(1, round(part.height * scale)))
    method = Image.Resampling.NEAREST if pixel else Image.Resampling.LANCZOS
    return part.resize(size, method)


def save_single(part, path, size, pixel=False, padding=0.08):
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    target_w = round(size[0] * (1 - padding * 2))
    target_h = round(size[1] * (1 - padding * 2))
    part = fit(part, target_w, target_h, pixel)
    canvas.alpha_composite(part, ((size[0] - part.width) // 2, (size[1] - part.height) // 2))
    path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(path)


def save_chain(parts, path, size, pixel=False, overlaps=None):
    overlaps = overlaps or [0] * (len(parts) - 1)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    usable_w = round(size[0] * 0.72)
    usable_h = round(size[1] * 0.88)
    natural = sum(part.height / max(1, part.width) for part in parts)
    heights = [round(usable_h * (part.height / max(1, part.width)) / natural) for part in parts]
    rendered = [fit(part, usable_w, max(1, height), pixel) for part, height in zip(parts, heights)]
    total_h = sum(part.height for part in rendered) - sum(overlaps)
    y = max(0, (size[1] - total_h) // 2)
    for index, part in enumerate(rendered):
        x = (size[0] - part.width) // 2
        canvas.alpha_composite(part, (x, y))
        y += part.height - (overlaps[index] if index < len(overlaps) else 0)
    path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(path)


def extract_pixel():
    image = Image.open(REFERENCE / "pixel_simple_modular_reference.png").convert("RGBA")
    out = OUTPUT / "pixel_simple"
    parts = {
        "head": crop_alpha(image, (750, 25, 950, 235)),
        "torso": crop_alpha(image, (720, 240, 975, 595)),
        "right_arm": crop_alpha(image, (535, 225, 675, 595)),
        "right_hand": crop_alpha(image, (535, 590, 680, 755)),
        "left_arm": crop_alpha(image, (1020, 225, 1160, 600)),
        "left_hand": crop_alpha(image, (1010, 590, 1160, 755)),
        "right_leg": crop_alpha(image, (690, 600, 840, 1025)),
        "right_foot": crop_alpha(image, (650, 1010, 845, 1190)),
        "left_leg": crop_alpha(image, (855, 600, 1015, 1025)),
        "left_foot": crop_alpha(image, (865, 1010, 1050, 1190)),
    }
    save_single(parts["head"], out / "pixel_simple_head_example.png", (128, 128), True)
    save_single(parts["torso"], out / "pixel_simple_torso_example.png", (128, 128), True)
    save_chain([parts["right_arm"], parts["right_hand"]], out / "pixel_simple_right_arm_example.png", (128, 256), True, [30])
    save_chain([parts["left_arm"], parts["left_hand"]], out / "pixel_simple_left_arm_example.png", (128, 256), True, [30])
    save_chain([parts["right_leg"], parts["right_foot"]], out / "pixel_simple_right_leg_example.png", (128, 256), True, [30])
    save_chain([parts["left_leg"], parts["left_foot"]], out / "pixel_simple_left_leg_example.png", (128, 256), True, [30])


def extract_standard():
    image = Image.open(REFERENCE / "standard_2d_modular_reference.png").convert("RGBA")
    out = OUTPUT / "standard_2d"
    parts = {
        "head": crop_alpha(image, (760, 15, 945, 210)),
        "chest": crop_alpha(image, (735, 205, 975, 480)),
        "pelvis": crop_alpha(image, (735, 465, 975, 645)),
        "right_upper": crop_alpha(image, (545, 145, 690, 365)),
        "right_fore": crop_alpha(image, (545, 360, 680, 550)),
        "right_hand": crop_alpha(image, (545, 535, 690, 720)),
        "left_upper": crop_alpha(image, (1030, 145, 1170, 365)),
        "left_fore": crop_alpha(image, (1030, 360, 1170, 550)),
        "left_hand": crop_alpha(image, (1025, 535, 1175, 720)),
        "right_thigh": crop_alpha(image, (715, 600, 840, 830)),
        "right_shin": crop_alpha(image, (700, 815, 835, 1090)),
        "right_foot": crop_alpha(image, (640, 1070, 850, 1245)),
        "left_thigh": crop_alpha(image, (860, 600, 985, 830)),
        "left_shin": crop_alpha(image, (855, 815, 990, 1090)),
        "left_foot": crop_alpha(image, (865, 1070, 1065, 1245)),
    }
    save_single(parts["head"], out / "standard_2d_head_example.png", (512, 512))
    save_chain([parts["pelvis"], parts["chest"]], out / "standard_2d_torso_example.png", (512, 1024), overlaps=[80])
    save_chain([parts["right_upper"], parts["right_fore"], parts["right_hand"]], out / "standard_2d_right_arm_example.png", (512, 1024), overlaps=[80, 80])
    save_chain([parts["left_upper"], parts["left_fore"], parts["left_hand"]], out / "standard_2d_left_arm_example.png", (512, 1024), overlaps=[80, 80])
    save_chain([parts["right_thigh"], parts["right_shin"], parts["right_foot"]], out / "standard_2d_right_leg_example.png", (512, 1024), overlaps=[72, 72])
    save_chain([parts["left_thigh"], parts["left_shin"], parts["left_foot"]], out / "standard_2d_left_leg_example.png", (512, 1024), overlaps=[72, 72])


if __name__ == "__main__":
    extract_pixel()
    extract_standard()
    print(f"Wrote example parts to {OUTPUT}")
