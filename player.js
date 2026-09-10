import fs from "fs";
import path from "path";
import audio from "audio";

const songsFolder = path.join(process.cwd(), "songs");

let songs = [];
let currentAudio = null;
let currentSong = null;

// let currentSongIndex = -1;
 

// let playbackState = "stopped";

// let audioPlayer = null;

// let songDuration = 0;
// let currentPosition = 0;

// let progressTimer = null;

function playSong(index) {
    if (index < 0 || index >= songs.length) {
        console.log("No song selected.");
        return;
    }

    // Stop previous song
    if (currentAudio) {
        currentAudio.stop();
        currentAudio = null;
    }

    currentSong = songs[index];

    try {
        // Create audio object from selected MP3
        currentAudio = audio(currentSong);

        // Handle playback errors
        currentAudio.on("error", (error) => {
            console.log("\nPlayback error:", error.message);
        });

        // Handle song completion
        currentAudio.on("ended", () => {
            console.log("\nPlayback finished.");
            currentAudio = null;
            currentSong = null;
        });

        // Start playback
        currentAudio.play();

        console.log(`\nPlaying: ${path.basename(currentSong)}`);

    } catch (error) {
        console.log("\nCould not play song:", error.message);
        currentAudio = null;
        currentSong = null;
    }
}

try {
    const files = fs.readdirSync(songsFolder);

    songs = files
        .filter(file => path.extname(file).toLowerCase() === ".mp3")
        .map(file => path.join(songsFolder, file));

    if (songs.length === 0) {
        console.log("No MP3 files found in the songs folder.");
        process.exit(0);
    }

} catch (error) {
    if (error.code === "ENOENT") {
        console.log("Songs folder does not exist.");
    } else {
        console.log("Error reading songs folder:", error.message);
    }

    process.exit(1);
}


// Currently selected song
let selectedIndex = 0;


// Draw the song list
function displaySongs() {
    // Clear the terminal and move cursor to the top
    process.stdout.write("\x1b[2J\x1b[H");

    console.log("🎵 MUSIC PLAYER\n");

    songs.forEach((song, index) => {
        const songName = path.basename(song);

        if (index === selectedIndex) {
            console.log(`→ ${songName}`);
        } else {
            console.log(`  ${songName}`);
        }
    });

    console.log("\n↑ ↓ Navigate   ENTER Select   Q Quit");
}


// Display the list for the first time
displaySongs();


// Enable keyboard input
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");


// Listen for keyboard input
process.stdin.on("data", (key) => {

    // Up arrow
    if (key === "\u001b[A") {
        if (selectedIndex > 0) {
            selectedIndex--;
            displaySongs();
        }
    }

    // Down arrow
    else if (key === "\u001b[B") {
        if (selectedIndex < songs.length - 1) {
            selectedIndex++;
            displaySongs();
        }
    }

    // Enter
// Enter
else if (key === "\r") {
    playSong(selectedIndex);
}
    // Q - quit
    else if (key.toLowerCase() === "q") {
        process.stdin.setRawMode(false);
        process.stdin.pause();

        process.stdout.write("\nGoodbye!\n");

        process.exit(0);
    }
});