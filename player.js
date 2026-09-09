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
    } else {
        console.log("Songs found:");

        songs.forEach((song, index) => {
            console.log(`${index + 1}. ${path.basename(song)}`);
        });
    }

} catch (error) {
    if (error.code === "ENOENT") {
        console.log("Songs folder does not exist.");
    } else {
        console.log("Error reading songs folder:", error.message);
    }
}