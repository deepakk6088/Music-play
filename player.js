import fs from "fs";
import path from "path";

const songsFolder = path.join(process.cwd(), "songs");

let songs = [];

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
    else if (key === "\r") {
        const selectedSong = path.basename(songs[selectedIndex]);

        console.log(`\nSelected: ${selectedSong}`);
    }

    // Q - quit
    else if (key.toLowerCase() === "q") {
        process.stdin.setRawMode(false);
        process.stdin.pause();

        process.stdout.write("\nGoodbye!\n");

        process.exit(0);
    }
});