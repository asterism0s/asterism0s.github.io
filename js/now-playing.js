const LASTFM_USER = "in-your-honor";
const LASTFM_API_KEY = "8b3c149012010c2de4c58be6a4acb092";
const REFRESH_MS = 60_000; 


const PLACEHOLDER_COVER = "2a96cbd8b46e442fc41c2b86b821562f";

const nowPlaying = document.querySelector("[data-now-playing]");

const lastfmEndpoint =
    "https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks" +
    `&user=${encodeURIComponent(LASTFM_USER)}` +
    `&api_key=${LASTFM_API_KEY}&format=json&limit=1`;

async function fetchLatestTrack() {
    const response = await fetch(lastfmEndpoint);
    if (!response.ok) throw new Error(`Last.fm responded ${response.status}`);

    const data = await response.json();
    const track = data.recenttracks?.track?.[0];
    if (!track) return null;

    const cover = track.image?.at(-1)?.["#text"] ?? "";

    return {
        title: track.name,
        artist: track.artist["#text"],
        url: track.url,
        cover: cover.includes(PLACEHOLDER_COVER) ? "" : cover,
        isLive: track["@attr"]?.nowplaying === "true",
    };
}

function renderTrack(track) {
    const coverImage = nowPlaying.querySelector("[data-np-cover]");
    const link = nowPlaying.querySelector("[data-np-link]");

    nowPlaying.querySelector("[data-np-label]").textContent = track.isLive
        ? "listening now..."
        : "last played...";

    link.textContent = track.title;
    link.href = track.url;
    nowPlaying.querySelector("[data-np-artist]").textContent = track.artist;

    coverImage.hidden = !track.cover;
    if (track.cover) coverImage.src = track.cover;

    nowPlaying.hidden = false;
}

async function updateNowPlaying() {
    try {
        const track = await fetchLatestTrack();
        if (track) renderTrack(track);
    } catch (error) {
        
        console.warn("Now playing:", error);
    }
}

if (nowPlaying) {
    updateNowPlaying();

    
    setInterval(() => {
        if (document.visibilityState === "visible") updateNowPlaying();
    }, REFRESH_MS);

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") updateNowPlaying();
    });
}