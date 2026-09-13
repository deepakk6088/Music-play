import fs from "fs";
import path from "path";
import audio from "audio";

const songsFolder = path.join(process.cwd(), "songs");

let songs = [];
let selectedIndex = 0;

let currentAudio = null;
let currentSong = null;

let playbackState = "stopped";
let progressTimer = null;


// --------------------
// Read songs
// --------------------

function loadSongs() {
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
}


// --------------------
// Stop progress timer
// --------------------

function stopProgress() {

    if (progressTimer !== null) {
        clearInterval(progressTimer);
        progressTimer = null;
    }
}


// --------------------
// Stop current playback
// --------------------

function stopCurrentPlayback() {

    stopProgress();

    if (currentAudio) {
        currentAudio.stop();
        currentAudio = null;
    }

    currentSong = null;
    playbackState = "stopped";
}


// --------------------
// Display progress
// --------------------

function displayProgress() {

    if (!currentAudio || !currentSong) {
        return;
    }

    const duration = currentAudio.duration || 0;
    const position = currentAudio.currentTime || 0;

    if (duration <= 0) {
        return;
    }

    const percentage = Math.min(
        (position / duration) * 100,
        100
    );

    const barLength = 20;

    const filledLength = Math.floor(
        (percentage / 100) * barLength
    );

    const bar =
        "█".repeat(filledLength) +
        "-".repeat(barLength - filledLength);

    process.stdout.write(
        `\r[${bar}] ${Math.floor(percentage)}% ` +
        `${position.toFixed(1)}s / ${duration.toFixed(1)}s`
    );
}


// --------------------
// Start progress timer
// --------------------

function startProgress() {

    stopProgress();

    progressTimer = setInterval(() => {

        if (
            playbackState !== "playing" ||
            !currentAudio
        ) {
            stopProgress();
            return;
        }

        displayProgress();

    }, 500);
}


// --------------------
// Display player
// --------------------

function displayPlayer() {

    // Move cursor to the top
    process.stdout.write("\x1b[H");

    console.log("=== Music Player ===\n");

    songs.forEach((song, index) => {

        const songName = path.basename(song);

        if (index === selectedIndex) {
            console.log(`→ ${songName}`);
        } else {
            console.log(`  ${songName}`);
        }

    });

    console.log("\n--------------------");

    if (currentSong && currentAudio) {

        const duration = currentAudio.duration || 0;
        const position = currentAudio.currentTime || 0;

        const percentage = duration > 0
            ? Math.min((position / duration) * 100, 100)
            : 0;

        const barLength = 20;

        const filledLength = Math.floor(
            (percentage / 100) * barLength
        );

        const bar =
            "█".repeat(filledLength) +
            "-".repeat(barLength - filledLength);

        console.log(`Song: ${path.basename(currentSong)}`);

        console.log(
            `[${bar}] ${Math.floor(percentage)}%`
        );

        console.log(
            `${position.toFixed(1)}s / ${duration.toFixed(1)}s`
        );

        console.log(`Status: ${playbackState}`);

    } else {

        console.log("No song playing.");
        console.log(`Status: ${playbackState}`);
    }

    console.log(
        "\n↑/↓ Navigate  Enter Play  P Pause/Resume"
    );

    console.log(
        "S Stop  N Next  B Previous  Q Quit"
    );
}


// --------------------
// Play song
// --------------------

async function playSong(index) {

    if (index < 0 || index >= songs.length) {
        return;
    }

    // Stop previous song and timer
    stopCurrentPlayback();

    const songPath = songs[index];

    currentSong = songPath;
    playbackState = "loading";

    displayPlayer();

    try {

        // Create audio directly from the MP3 file
        const newAudio = audio(songPath);

        currentAudio = newAudio;

        // Wait until the audio is decoded and ready
        await newAudio.ready;

        // Make sure this is still the current song.
        // This prevents an old song from starting
        // if the user switched songs while it was loading.
        if (currentAudio !== newAudio) {
            newAudio.stop();
            return;
        }

        // When the current song finishes
        newAudio.on("ended", () => {

            if (currentAudio !== newAudio) {
                return;
            }

            stopProgress();

            // Move to the next song
            if (selectedIndex < songs.length - 1) {
                selectedIndex++;
            } else {
                // After the last song,
                // start again from the first song
                selectedIndex = 0;
            }

            playSong(selectedIndex);
        });

        // Start playback
        newAudio.play();

        playbackState = "playing";

        startProgress();

        displayPlayer();

    } catch (error) {

        if (currentAudio !== newAudio) {
            return;
        }

        stopProgress();

        currentAudio = null;
        currentSong = null;
        playbackState = "stopped";

        console.log(
            "\nCould not play song:",
            error.message
        );

        displayPlayer();
    }
}


// --------------------
// Pause / Resume
// --------------------

function togglePause() {

    if (!currentAudio) {
        return;
    }

    if (playbackState === "playing") {

        currentAudio.pause();

        playbackState = "paused";

        stopProgress();

        displayPlayer();

    } else if (playbackState === "paused") {

        currentAudio.resume();

        playbackState = "playing";

        startProgress();

        displayPlayer();
    }
}


// --------------------
// Stop song
// --------------------

function stopSong() {

    stopCurrentPlayback();

    displayPlayer();
}


// --------------------
// Next song
// --------------------

function nextSong() {

    if (songs.length === 0) {
        return;
    }

    if (selectedIndex < songs.length - 1) {
        selectedIndex++;
    } else {
        selectedIndex = 0;
    }

    playSong(selectedIndex);
}


// --------------------
// Previous song
// --------------------

function previousSong() {

    if (songs.length === 0) {
        return;
    }

    if (selectedIndex > 0) {
        selectedIndex--;
    } else {
        selectedIndex = songs.length - 1;
    }

    playSong(selectedIndex);
}


// --------------------
// Cleanup
// --------------------

function cleanup() {

    stopProgress();

    if (currentAudio) {
        currentAudio.stop();
        currentAudio = null;
    }

    currentSong = null;
    playbackState = "stopped";

    if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
    }

    process.stdin.pause();

    // Show cursor again
    process.stdout.write("\x1b[?25h");

    // Clear terminal
    process.stdout.write("\x1b[2J\x1b[H");
}


// --------------------
// Quit
// --------------------

function quit() {

    cleanup();

    console.log("Goodbye!");

    process.exit(0);
}


// --------------------
// Handle keyboard input
// --------------------

function handleInput(key) {

    // Ctrl + C
    if (key === "\u0003") {
        quit();
    }

    // Up arrow
    else if (key === "\u001b[A") {

        if (selectedIndex > 0) {
            selectedIndex--;
            displayPlayer();
        }
    }

    // Down arrow
    else if (key === "\u001b[B") {

        if (selectedIndex < songs.length - 1) {
            selectedIndex++;
            displayPlayer();
        }
    }

    // Enter
    else if (key === "\r") {

        playSong(selectedIndex);
    }

    // P = Pause / Resume
    else if (key.toLowerCase() === "p") {

        togglePause();
    }

    // S = Stop
    else if (key.toLowerCase() === "s") {

        stopSong();
    }

    // N = Next
    else if (key.toLowerCase() === "n") {

        nextSong();
    }

    // B = Previous
    else if (key.toLowerCase() === "b") {

        previousSong();
    }

    // Q = Quit
    else if (key.toLowerCase() === "q") {

        quit();
    }
}


// --------------------
// Start application
// --------------------

loadSongs();

// Clear terminal only once when starting
process.stdout.write("\x1b[2J\x1b[H");

// Hide cursor
process.stdout.write("\x1b[?25l");

displayPlayer();

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");

process.stdin.on("data", handleInput);