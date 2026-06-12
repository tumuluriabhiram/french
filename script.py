import hashlib
import re
from pathlib import Path
from gtts import gTTS

# Define paths
src_folder = Path("./src")
public_folder = Path("./public")
voices_folder = public_folder / "voices"

# Create output directories if they don't exist
voices_folder.mkdir(parents=True, exist_ok=True)

# Regex pattern to capture the text inside onclick="speak('text')"
# Group 1 captures the actual text, Group 0 is the full match string
pattern = r"speak\(['\"]([^'\"]*)['\"]\)"


def get_text_hash(text: str) -> str:
    """Generates a unique MD5 hex hash for a given string."""
    return hashlib.md5(text.encode("utf-8")).hexdigest()


# Loop through all .html files in the src folder
for file_path in src_folder.glob("*.html"):
    print(f"Processing: {file_path.name}")

    try:
        content = file_path.read_text(encoding="utf-8")

        # Find all matching speak('text') patterns
        matches = re.findall(pattern, content)

        if not matches:
            # If no matches, copy the file as-is to the public folder
            (public_folder / file_path.name).write_text(
                content, encoding="utf-8"
            )
            continue

        # We will track modifications for this specific file
        modified_content = content

        for text in matches:
            # 1. Clean/strip the text just in case, or use exactly what's inside
            text_to_speak = text.strip()
            if not text_to_speak:
                continue

            # 2. Generate hash
            text_hash = get_text_hash(text_to_speak)
            audio_filename = f"{text_hash}.mp3"
            audio_file_path = voices_folder / audio_filename

            # 3. Generate voice file if it doesn't already exist
            if not audio_file_path.exists():
                print(f"  -> Generating audio for: '{text_to_speak[:20]}...'")
                try:
                    tts = gTTS(text=text_to_speak, lang="fr")
                    tts.save(str(audio_file_path))
                except Exception as tts_err:
                    print(f"     Error generating TTS for '{text}': {tts_err}")
                    continue
            else:
                print(f"  -> [Skipped] Audio already exists for hash: {text_hash}")

            # 4. Replace onclick="speak('text')" with the hash version: speak('hash')
            # Target exactly the match corresponding to this specific text snippet
            old_string = f"onclick=\"speak('{text}')\""
            new_string = f"onclick=\"speak('{text_hash}')\""
            modified_content = modified_content.replace(old_string, new_string)

        # 5. Save the modified file into the public folder
        output_file_path = public_folder / file_path.name
        output_file_path.write_text(modified_content, encoding="utf-8")
        print(f"  Saved modified file to: {output_file_path}\n")

    except Exception as e:
        print(f"Error processing {file_path.name}: {e}\n")

print("All files processed successfully!")