import fs from "fs";
import path from "path";
import audio from "audio";

const songsFolder = path.join(process.cwd(), "songs");

let songs = [];
let currentAudio = null;
let currentSong = null;
 
let playbackState = "stopped";
let progressTimer = null;

// let currentSongIndex = -1;
 

// let playbackState = "stopped";

// let audioPlayer = null;

// let songDuration = 0;
// let currentPosition = 0;

// let progressTimer = null;

function playSong(index) {
    if (index < 0 || index >= songs.length) {
        return;
    }

    // Stop previous playback
    if (currentAudio) {
        currentAudio.stop();
        currentAudio = null;
    }

    // Stop previous progress timer
    stopProgress();

    currentSong = songs[index];

    try {
        currentAudio = audio(currentSong);

        currentAudio.on("ended", () => {
            stopProgress();

            currentAudio = null;
            currentSong = null;
            playbackState = "stopped";
        });

        currentAudio.play();

        playbackState = "playing";

        startProgress();

        console.log(`\nPlaying: ${path.basename(currentSong)}`);

    } catch (error) {
        stopProgress();

        console.log("\nCould not play song:", error.message);

        currentAudio = null;
        currentSong = null;
        playbackState = "stopped";
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

// add pause
function pauseSong() {
    if (!currentAudio || playbackState !== "playing") {
        return;
    }

    currentAudio.pause();
    playbackState = "paused";

    stopProgress();

    console.log("\nPaused.");
}

function displayProgress() {
    if (!currentAudio || !currentSong) {
        return;
    }

    const duration = currentAudio.duration || 0;
    const position = currentAudio.currentTime || 0;

    if (duration <= 0) {
        return;
    }

    // Never allow progress to go above 100%
    const percentage = Math.min((position / duration) * 100, 100);

    const barLength = 20;
    const filledLength = Math.floor((percentage / 100) * barLength);

    const bar =
        "█".repeat(filledLength) +
        "-".repeat(barLength - filledLength);

    console.log(
        `\r[${bar}] ${Math.floor(percentage)}% ` +
        `${position.toFixed(1)}s / ${duration.toFixed(1)}s`
    );
}


function startProgress() {
    stopProgress();

    progressTimer = setInterval(() => {
        if (playbackState !== "playing" || !currentAudio) {
            stopProgress();
            return;
        }

        displayProgress();
    }, 500);
}


function stopProgress() {
    if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
    }
}

function stopSong() {
    if (!currentAudio) {
        return;
    }

    currentAudio.stop();
    currentAudio = null;
    currentSong = null;

    stopProgress();

    playbackState = "stopped";

    console.log("\nStopped.");
}
// add resume
function resumeSong() {
    if (!currentAudio || playbackState !== "paused") {
        return;
    }

    currentAudio.resume();
    playbackState = "playing";

    startProgress();

    console.log("\nResumed.");
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
    else if (key.toLowerCase() === "p") {
    if (playbackState === "playing") {
        pauseSong();
    } else if (playbackState === "paused") {
        resumeSong();
    }
    else if (key.toLowerCase() === "n") {
    nextSong();
}

else if (key.toLowerCase() === "b") {
    previousSong();
}
}
});