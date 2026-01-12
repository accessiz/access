import os
import re


# Define allowed Tailwind color names from config
ALLOWED_COLORS = {
    'background', 'foreground', 'border', 'ring',
    'sys-bg', 'sys-bg-secondary', 'sys-bg-tertiary',
    'quaternary', 'quinary', 'hover-overlay', 'separator', 'input',
    'muted', 'muted-foreground',
    'accent', 'accent-foreground',
    'card', 'card-foreground',
    'popover', 'popover-foreground',
    'destructive', 'success', 'warning', 'info',
    'cyan', 'indigo', 'orange', 'red', 'yellow', 'green', 'mint', 'teal', 'blue',
    'purple', 'access-purple', 'pink', 'brown',
    'primary', 'secondary', 'tertiary',
    'sidebar', 'white', 'black',
    'transparent', 'current', 'inherit'
}

# Typography classes to ignore (false positives for color checks)
TYPOGRAPHY_CLASSES = {
    'display', 'title', 'body', 'label', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl',
    'left', 'center', 'right', 'justify', 'start', 'end', 'wrap', 'nowrap', 'clip', 'ellipsis'
}

# Regex patterns
HEX_PATTERN = re.compile(r'#[0-9a-fA-F]{3,8}')
# Arbitrary Tailwind values like bg-[#...] or text-[rgb(...)]
ARBITRARY_TW_PATTERN = re.compile(r'\b(bg|text|border|ring|outline|fill|stroke)-\[.*?\]')
# Standard Tailwind colors with numeric scales that might not be in our allowed list (e.g. red-500 if we only have red)
# Regex for color utility: (bg|text|border|ring|outline|fill|stroke)-([a-zA-Z0-9\-]+)
# We will inspect the simplified class name.
TW_COLOR_CLASS_PATTERN = re.compile(r'\b(bg|text|border|ring|outline|fill|stroke)-([a-z]+)(?:-([0-9]+))?(?:/[0-9]+)?\b')

# Directories to ignore
IGNORE_DIRS = {'node_modules', '.next', '.git', '.gemini', 'dist', 'build'}
# Files to ignore (e.g., globals.css since it defines the variables)
IGNORE_FILES = {'globals.css', 'tailwind.config.ts', 'audit_colors.py', 'DESIGN_SYSTEM.md'}

def is_allowed_color(color_name, shade):
    if color_name in TYPOGRAPHY_CLASSES:
        return True # It's a valid class, just not a color, so "allowed" in context of not being a color violation
        
    # Check if color_name is in allowed list
    if color_name in ALLOWED_COLORS:
        if shade:
            # Allow shades if they are numeric but wait, user said ONLY globals.
            # If shade is present (e.g. red-500), it's using Tailwind palette.
            # Our config maps 'red' -> 'var(--red)'. It does NOT map 'red-500'.
            # So red-500 is likely unauthorized.
            return False 
        return True
    return False

def audit_file(filepath):
    violations = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except UnicodeDecodeError:
        # Try latin-1 or just skip
        print(f"Skipping file due to encoding (binary?): {os.path.basename(filepath)}")
        return []
        
    for i, line in enumerate(lines):
        line_num = i + 1
        
        # 1. Check Hex Codes
        hex_matches = HEX_PATTERN.findall(line)
        for hex_val in hex_matches:
             # Basic filter for short hexes that might be other things, but #XXX is usually color
            if 'url' in line: continue # Skip url definitions
            violations.append(f"Line {line_num}: Hardcoded Hex '{hex_val}'")

        # 2. Check Arbitrary Tailwind
        for m in re.finditer(r'\b(bg|text|border|ring|outline|fill|stroke)-\[([^\]]+)\]', line):
            violations.append(f"Line {line_num}: Arbitrary Value '{m.group(0)}'")

        # 3. Check Tailwind Color Classes
        for m in TW_COLOR_CLASS_PATTERN.finditer(line):
            prefix = m.group(1)
            color = m.group(2)
            shade = m.group(3)
            full_match = m.group(0)
            
            # Special case for 'transparent', 'current'
            if color in ['transparent', 'current', 'inherit']:
                continue
                
            if not is_allowed_color(color, shade):
                if color in TYPOGRAPHY_CLASSES: continue
                violations.append(f"Line {line_num}: Unauthorized Class '{full_match}' (Color '{color}' {'shade ' + shade if shade else ''} not in design system)")

    return violations

def main():
    root_dir = os.path.join(os.getcwd(), 'src')
    print(f"Auditing colors in {root_dir}...")
    
    total_violations = 0
    
    for root, dirs, files in os.walk(root_dir):
        # Filter directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            if file in IGNORE_FILES:
                continue
            if not (file.endswith('.tsx') or file.endswith('.ts') or file.endswith('.css')):
                continue
                
            filepath = os.path.join(root, file)
            file_violations = audit_file(filepath)
            
            if file_violations:
                print(f"\nFile: {os.path.relpath(filepath, os.getcwd())}")
                for v in file_violations:
                    print(f"  - {v}")
                total_violations += len(file_violations)

    if total_violations == 0:
        print("\n✅ No unauthorized colors found!")
    else:
        print(f"\n❌ Found {total_violations} color violations.")

if __name__ == "__main__":
    main()
