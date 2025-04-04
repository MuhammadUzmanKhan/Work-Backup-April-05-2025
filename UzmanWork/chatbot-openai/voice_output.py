from gtts import gTTS
from pydub import AudioSegment
from pydub.playback import play
import os

def play_voice_output(response):
    language = 'en'  # Adjust the language as needed
    temp_file_name = "temp_voice_output.mp3"
    
    myobj = gTTS(text=response, lang=language, slow=False)
    myobj.save(temp_file_name)
    print(f"File saved: {temp_file_name}")

    # Play the converted audio file using pydub
    sound = AudioSegment.from_mp3(temp_file_name)
    play(sound)

    # Delete the temporary MP3 file after playback
    os.remove(temp_file_name)
