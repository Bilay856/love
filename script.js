// =====================================
// 1. ЭЛЕМЕНТЫ И ПЕРЕМЕННЫЕ
// =====================================

const screens = document.querySelectorAll(".screen");

const universeCanvas = document.getElementById("universeCanvas");
const ctx = universeCanvas.getContext("2d");

const PARTICLE_COUNT = 100;

const BASE_TILT = 1.0;
const BASE_ROLL = -0.45;

let particles = [];
let hazeParticles = [];
let dustParticles = [];
let dotParticles = [];
let allWords = [];

let rotation = 0;
let targetRotation = 0;

let tilt = BASE_TILT;
let targetTilt = BASE_TILT;

let zoom = 1;

let dragging = false;
let lastX = 0;
let lastY = 0;

let animationId = null;

let uploadedImage = null;
let photoURL = null;
let grayscaleImageCanvas = null;
let photoBounds = null;

let firstOpened = false;
let lastOpened = false;

let currentWord = "";

let portraitMode = false;
let portraitStartTime = 0;
let portraitTargets = [];
let portraitFinished = false;


// =====================================
// 2. ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ
// =====================================

function showScreen(id) {
    screens.forEach(screen => {
        screen.classList.toggle("active", screen.id === id);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
}


// =====================================
// 3. ЗВЁЗДНОЕ НЕБО
// =====================================

const starsContainer = document.getElementById("stars");

for (let i = 0; i < 180; i++) {
    const star = document.createElement("div");

    star.className = "star";
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    star.style.animationDelay = Math.random() * 4 + "s";

    starsContainer.appendChild(star);
}


// =====================================
// 4. ПЕРВОЕ ПИСЬМО
// =====================================

function openFirstLetter() {
    if (firstOpened) return;

    firstOpened = true;

    document
        .querySelector("#firstEnvelope .envelope")
        .classList.add("open");

    setTimeout(() => showScreen("inputScreen"), 850);
}

document.getElementById("openFirst")
    .addEventListener("click", openFirstLetter);

document.getElementById("firstEnvelope")
    .addEventListener("click", openFirstLetter);


// =====================================
// 5. РАЗМЕР CANVAS
// =====================================

function resizeUniverse() {
    const rect = universeCanvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    universeCanvas.width = Math.round(rect.width * dpr);
    universeCanvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", () => {
    if (
        document.getElementById("universeScreen")
            .classList.contains("active")
    ) {
        resizeUniverse();
    }
});


// =====================================
// 6. СОЗДАНИЕ СПИРАЛЬНОЙ ГАЛАКТИКИ
// =====================================

const ARMS = 4;
const spriteCache = {};

function getSprite(rgb) {
    if (spriteCache[rgb]) return spriteCache[rgb];

    const sprite = document.createElement("canvas");

    sprite.width = 64;
    sprite.height = 64;

    const spriteCtx = sprite.getContext("2d");

    const gradient = spriteCtx.createRadialGradient(
        32, 32, 0,
        32, 32, 32
    );

    gradient.addColorStop(0, `rgba(${rgb},1)`);
    gradient.addColorStop(1, `rgba(${rgb},0)`);

    spriteCtx.fillStyle = gradient;
    spriteCtx.fillRect(0, 0, 64, 64);

    spriteCache[rgb] = sprite;

    return sprite;
}

function randomGauss() {
    return (
        Math.random() +
        Math.random() +
        Math.random() - 1.5
    ) / 1.5;
}

function armAngle(arm, r) {
    return arm * (Math.PI * 2 / ARMS) +
        Math.log(1 + r * 6) * 3;
}

function wordColor(r) {
    if (r < 0.2) return "#fff1cf";
    if (r < 0.45) return "#f3dcb4";
    if (r < 0.7) return "#e2d3c4";

    return "#b9cbf2";
}

function hazeColor(r) {
    if (r < 0.25) return "255,226,170";
    if (r < 0.6) return "225,205,185";

    return "150,180,255";
}

function generateUniverse(words) {
    allWords = words;

    particles = [];
    hazeParticles = [];
    dustParticles = [];
    dotParticles = [];

    portraitMode = false;
    portraitFinished = false;
    portraitTargets = [];
    grayscaleImageCanvas = null;
    photoBounds = null;

    // Центральное ядро
    for (let i = 0; i < 90; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.abs(randomGauss()) * 0.16;

        particles.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
            z: randomGauss() * 0.08,
            word: words[Math.floor(Math.random() * words.length)],
            size: 8 + Math.random() * 4,
            color: "#fff1cf",
            alpha: 0.7 + Math.random() * 0.3
        });
    }

    // Свечение центра
    for (let i = 0; i < 160; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.abs(randomGauss()) * 0.22;

        hazeParticles.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
            z: randomGauss() * 0.06,
            size: 0.05 + Math.random() * 0.08,
            rgb: "255,226,170",
            alpha: 0.05 + Math.random() * 0.05
        });
    }

    // Спиральные рукава
    for (let i = 0; i < 560; i++) {
        const r = Math.pow(Math.random(), 1.5) * 0.97;

        const arm = Math.floor(Math.random() * ARMS);

        let spread = 0.12 + r * 0.35;

        if (Math.random() < 0.15) spread = 0.9;

        const angle =
            armAngle(arm, r) +
            randomGauss() * spread;

        particles.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
            z: randomGauss() * 0.05 * (1 - r * 0.6),
            word: words[Math.floor(Math.random() * words.length)],
            size: 9 + Math.random() * 5,
            color: wordColor(r),
            alpha: 0.35 +
                (1 - r) * 0.45 *
                (0.6 + Math.random() * 0.4)
        });
    }

    // Голубые скопления
    for (let c = 0; c < 70; c++) {
        const r = 0.2 + Math.random() * 0.7;

        const arm = Math.floor(Math.random() * ARMS);

        const angle =
            armAngle(arm, r) +
            randomGauss() * 0.15;

        const clusterX = Math.cos(angle) * r;
        const clusterY = Math.sin(angle) * r;

        for (let j = 0; j < 3; j++) {
            particles.push({
                x: clusterX + randomGauss() * 0.03,
                y: clusterY + randomGauss() * 0.03,
                z: randomGauss() * 0.03,
                word: words[Math.floor(Math.random() * words.length)],
                size: 10 + Math.random() * 4,
                color: "#e6f0ff",
                alpha: 0.85 + Math.random() * 0.15
            });
        }

        hazeParticles.push({
            x: clusterX,
            y: clusterY,
            z: 0,
            size: 0.04 + Math.random() * 0.04,
            rgb: "170,200,255",
            alpha: 0.12 + Math.random() * 0.08
        });
    }

    // Общее свечение
    for (let i = 0; i < 700; i++) {
        const r = Math.pow(Math.random(), 1.4) * 0.97;

        const arm = Math.floor(Math.random() * ARMS);

        const angle =
            armAngle(arm, r) +
            randomGauss() * (0.2 + r * 0.4);

        let alpha = 0.05 + Math.random() * 0.05;

        if (r < 0.3) alpha *= 0.6;

        hazeParticles.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
            z: randomGauss() * 0.03,
            size: 0.05 + Math.random() * 0.08,
            rgb: hazeColor(r),
            alpha
        });
    }

    // Пылевые полосы
    for (let i = 0; i < 450; i++) {
        const r = 0.15 + Math.random() * 0.7;

        const arm = Math.floor(Math.random() * ARMS);

        const angle =
            armAngle(arm, r) -
            0.15 +
            randomGauss() * 0.06;

        dustParticles.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
            z: 0,
            size: 0.03 + Math.random() * 0.04,
            rgb: "30,18,10",
            alpha: 0.15 + Math.random() * 0.15
        });
    }

    // Маленькие звёздочки
    for (let i = 0; i < 300; i++) {
        const r = Math.pow(Math.random(), 1.2);

        const angle = Math.random() * Math.PI * 2;

        dotParticles.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
            z: randomGauss() * 0.05,
            size: 0.6 + Math.random() * 1.2,
            alpha: 0.4 + Math.random() * 0.6
        });
    }

    resizeUniverse();

    cancelAnimationFrame(animationId);

    animateUniverse();
}


// =====================================
// 7. ПОВОРОТ ГАЛАКТИКИ
// =====================================

function rotatePoint(point) {
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);

    const x = point.x * cosR - point.y * sinR;
    const y = point.x * sinR + point.y * cosR;

    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);

    const y2 = y * cosT - point.z * sinT;
    const z2 = y * sinT + point.z * cosT;

    const cosS = Math.cos(BASE_ROLL);
    const sinS = Math.sin(BASE_ROLL);

    return {
        x: x * cosS - y2 * sinS,
        y: x * sinS + y2 * cosS,
        z: z2
    };
}

function project(point, centerX, centerY, radius) {
    const rotated = rotatePoint(point);

    const perspective = 1 / (1.7 - rotated.z * 0.3);

    return {
        x: centerX + rotated.x * radius * perspective,
        y: centerY + rotated.y * radius * perspective,
        z: rotated.z,
        p: perspective
    };
}


// =====================================
// 8. РИСОВАНИЕ ГАЛАКТИКИ
// =====================================

function drawGalaxyBackground(width, height) {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#02030a";
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        width * 0.6
    );

    glow.addColorStop(0, "rgba(40, 50, 90, 0.18)");
    glow.addColorStop(1, "transparent");

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
}

function animateUniverse() {
    const width = universeCanvas.clientWidth;
    const height = universeCanvas.clientHeight;

    if (!width || !height) {
        animationId = requestAnimationFrame(animateUniverse);
        return;
    }

    drawGalaxyBackground(width, height);

    // Фотография постепенно проявляется
    if (portraitMode && grayscaleImageCanvas) {
        const progress = Math.min(
            1,
            (performance.now() - portraitStartTime) / 5500
        );

        const imageOpacity = progress * 0.65;

        ctx.save();
        ctx.globalAlpha = imageOpacity;

        ctx.drawImage(
            grayscaleImageCanvas,
            0,
            0,
            width,
            height
        );

        ctx.restore();
    }

    // Прогресс превращения
    const morphProgress = portraitMode
        ? Math.min(
            1,
            (performance.now() - portraitStartTime) / 5500
        )
        : 0;

    const easedMorph =
        morphProgress * morphProgress *
        (3 - 2 * morphProgress);

    // Останавливаем вращение при создании портрета
    if (!dragging && !portraitMode) {
        targetRotation += 0.0009;
    }

    if (!portraitMode) {
        rotation += (targetRotation - rotation) * 0.08;
        tilt += (targetTilt - tilt) * 0.08;
    }

    const centerX = width / 2;
    const centerY = height / 2;

    const majorRadius = Math.min(
        width * 0.5 / 0.93,
        height * 0.5 / 0.65
    ) * 0.95;

    const radius = majorRadius / 0.57 * zoom;

    const wordScale = Math.max(
        1,
        Math.min(1.5, majorRadius / 260)
    );

    // Фоновые звёзды
    for (let i = 0; i < 100; i++) {
        const x = (i * 137.5) % width;
        const y = (i * 83.7) % height;

        ctx.globalAlpha =
            (0.2 + (i % 5) * 0.1) *
            (1 - easedMorph);

        ctx.fillStyle = "#ffffff";

        ctx.beginPath();
        ctx.arc(x, y, 0.7 + (i % 3) * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Свечение диска
    ctx.globalCompositeOperation = "lighter";

    hazeParticles.forEach(point => {
        const p = project(point, centerX, centerY, radius);

        const size = point.size * radius * p.p * 2;

        ctx.globalAlpha = point.alpha * (1 - easedMorph);

        ctx.drawImage(
            getSprite(point.rgb),
            p.x - size / 2,
            p.y - size / 2,
            size,
            size
        );
    });

    ctx.globalCompositeOperation = "source-over";

    // Пыль
    dustParticles.forEach(point => {
        const p = project(point, centerX, centerY, radius);

        const size = point.size * radius * p.p * 2;

        ctx.globalAlpha = point.alpha * (1 - easedMorph);

        ctx.drawImage(
            getSprite(point.rgb),
            p.x - size / 2,
            p.y - size / 2,
            size,
            size
        );
    });

    // Звёздочки
    ctx.fillStyle = "#ffffff";

    dotParticles.forEach(point => {
        const p = project(point, centerX, centerY, radius);

        ctx.globalAlpha = point.alpha * (1 - easedMorph);

        ctx.beginPath();
        ctx.arc(p.x, p.y, point.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Слова
    const sorted = [];

    particles.forEach((point, index) => {
        const p = project(point, centerX, centerY, radius);

        let x = p.x;
        let y = p.y;
        let alpha = point.alpha;
        let color = point.color;

        let fontSize = Math.max(
            6,
            point.size * p.p * wordScale
        );

        if (portraitMode && portraitTargets[index]) {
            const target = portraitTargets[index];

            // Слова находятся внутри фотографии
            x = target.x;
            y = target.y;

            // ПРОЗРАЧНОСТЬ СЛОВ 95%
            alpha = 0.15 * easedMorph;

            color = target.color;

            fontSize = 11;
        }

        sorted.push({
            x,
            y,
            z: p.z,
            word: point.word,
            color,
            alpha,
            fontSize
        });
    });

    sorted.sort((a, b) => a.z - b.z);

    // Ограничиваем слова границами фотографии
    if (portraitMode && photoBounds) {
        ctx.save();

        ctx.beginPath();

        ctx.rect(
            photoBounds.x,
            photoBounds.y,
            photoBounds.width,
            photoBounds.height
        );

        ctx.clip();
    }

    sorted.forEach(point => {
        ctx.globalAlpha = point.alpha;

        ctx.font = `bold ${point.fontSize}px Georgia`;
        ctx.fillStyle = point.color;

        ctx.shadowBlur = portraitMode ? 2 : 0;
        ctx.shadowColor = point.color;

        ctx.fillText(point.word, point.x, point.y);
    });

    if (portraitMode && photoBounds) {
        ctx.restore();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Ядро галактики исчезает
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 1 - easedMorph;

    const halo = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius * 0.45
    );

    halo.addColorStop(0, "rgba(255, 215, 150, 0.22)");
    halo.addColorStop(1, "rgba(255, 200, 120, 0)");

    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);

    const core = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius * 0.2
    );

    core.addColorStop(0, "rgba(255, 246, 220, 0.95)");
    core.addColorStop(0.25, "rgba(255, 222, 160, 0.45)");
    core.addColorStop(1, "rgba(255, 200, 120, 0)");

    ctx.fillStyle = core;
    ctx.fillRect(0, 0, width, height);

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // Завершение превращения
    if (
        portraitMode &&
        morphProgress >= 1 &&
        !portraitFinished
    ) {
        portraitFinished = true;

        document.getElementById("photoStatus").textContent =
            "Портрет из слов готов ✨";

        document.getElementById("toFinal").disabled = false;
    }

    // После завершения портрета прекращаем перерисовку
    if (portraitFinished) {
        animationId = null;
        return;
    }

    animationId = requestAnimationFrame(animateUniverse);
}


// =====================================
// 9. УПРАВЛЕНИЕ ГАЛАКТИКОЙ
// =====================================

universeCanvas.addEventListener("pointerdown", event => {
    if (portraitMode) return;

    dragging = true;

    lastX = event.clientX;
    lastY = event.clientY;

    universeCanvas.setPointerCapture(event.pointerId);
});

universeCanvas.addEventListener("pointermove", event => {
    if (!dragging || portraitMode) return;

    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;

    targetRotation += dx * 0.008;
    targetTilt += dy * 0.004;

    targetTilt = Math.max(
        0.1,
        Math.min(1.45, targetTilt)
    );

    lastX = event.clientX;
    lastY = event.clientY;
});

function stopDragging() {
    dragging = false;
}

universeCanvas.addEventListener("pointerup", stopDragging);
universeCanvas.addEventListener("pointercancel", stopDragging);


// =====================================
// 10. ПРИБЛИЖЕНИЕ
// =====================================

function changeZoom(value) {
    if (portraitMode) return;

    zoom = Math.max(
        0.55,
        Math.min(2, zoom + value)
    );
}

document.getElementById("zoomIn")
    .addEventListener("click", () => changeZoom(0.15));

document.getElementById("zoomOut")
    .addEventListener("click", () => changeZoom(-0.15));

document.getElementById("resetUniverse")
    .addEventListener("click", () => {
        if (portraitMode) return;

        targetRotation = 0;
        targetTilt = BASE_TILT;
        zoom = 1;
    });

universeCanvas.addEventListener("wheel", event => {
    event.preventDefault();

    changeZoom(event.deltaY < 0 ? 0.1 : -0.1);
}, { passive: false });


// =====================================
// 11. ПЕРЕВОДЫ
// =====================================

const languageCodes = [
    "en", "es", "fr", "de",
    "it", "pt", "tr", "ar",
    "ja", "ko", "zh-CN", "hi",
    "ky", "kk", "he", "el"
];

async function getTranslation(word, lang) {
    try {
        const url =
            "https://api.mymemory.translated.net/get?q=" +
            encodeURIComponent(word) +
            "&langpair=" +
            encodeURIComponent("ru|" + lang);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Translation error");
        }

        const data = await response.json();

        if (
            data.responseStatus === 200 &&
            data.responseData.translatedText
        ) {
            return data.responseData.translatedText;
        }
    } catch (error) {
        console.warn("Не удалось перевести на:", lang);
    }

    return word;
}


// =====================================
// 12. СОЗДАНИЕ СЛОВ
// =====================================

async function createWordUniverse(word) {
    const translations = await Promise.all(
        languageCodes.map(lang => getTranslation(word, lang))
    );

    const validWords = translations
        .map(item => item.trim())
        .filter(Boolean);

    if (!validWords.length) {
        validWords.push(word);
    }

    validWords.push(word);

    const words = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        words.push(
            validWords[
                Math.floor(Math.random() * validWords.length)
            ]
        );
    }

    return words;
}


// =====================================
// 13. ОТПРАВКА СЛОВА
// =====================================

document.getElementById("wordForm")
    .addEventListener("submit", async event => {
        event.preventDefault();

        const word = document
            .getElementById("wordInput")
            .value.trim();

        if (!word) return;

        currentWord = word;

        showScreen("universeScreen");

        document.getElementById("galaxyTitle").textContent =
            `«${word}»`;

        const status =
            document.getElementById("translationStatus");

        const createButton =
            document.getElementById("createPortrait");

        createButton.disabled = true;

        status.textContent = "Создаём галактику...";

        try {
            const words = await createWordUniverse(word);

            generateUniverse(words);

            status.textContent =
                `Галактика готова · ${words.length} слов`;

            createButton.disabled = !uploadedImage;

        } catch (error) {
            console.error(error);

            status.textContent =
                "Не удалось создать галактику. Попробуй ещё раз.";
        }
    });


// =====================================
// 14. ЗАГРУЗКА ФОТОГРАФИИ
// =====================================

document.getElementById("photoInput")
    .addEventListener("change", event => {
        const file = event.target.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Выбери изображение!");
            return;
        }

        if (photoURL) {
            URL.revokeObjectURL(photoURL);
        }

        photoURL = URL.createObjectURL(file);

        const image = new Image();

        image.onload = () => {
            uploadedImage = image;

            document.getElementById("photoStatus").textContent =
                "Фотография загружена ✓";

            document.getElementById("createPortrait").disabled =
                allWords.length === 0;
        };

        image.onerror = () => {
            alert("Не удалось открыть фотографию.");

            URL.revokeObjectURL(photoURL);
            photoURL = null;
        };

        image.src = photoURL;
    });


// =====================================
// 15. ГОТОВОЕ ФОТО PHOTO.JPG
// =====================================

const PHOTO_FILE = "photo.jpg";

let presetLoaded = false;

const presetImage = new Image();

presetImage.onload = () => {
    presetLoaded = true;

    if (!photoURL) {
        uploadedImage = presetImage;

        document.getElementById("photoStatus").textContent =
            "Готовая фотография загружена ✓";

        document.getElementById("createPortrait").disabled =
            allWords.length === 0;
    }
};

presetImage.onerror = () => {
    console.warn("Файл " + PHOTO_FILE + " не найден");
};

presetImage.src = PHOTO_FILE;


// =====================================
// 16. СОЗДАНИЕ ПОРТРЕТА ИЗ СЛОВ
// =====================================

function createWordPortrait() {
    if (!uploadedImage || !allWords.length) return;
    if (portraitMode) return;

    const width = universeCanvas.clientWidth;
    const height = universeCanvas.clientHeight;

    if (!width || !height) return;

    const tempCanvas = document.createElement("canvas");

    tempCanvas.width = width;
    tempCanvas.height = height;

    const tempCtx = tempCanvas.getContext(
        "2d",
        { willReadFrequently: true }
    );

    // Размещаем фотографию целиком
    const scale = Math.min(
        width * 0.78 / uploadedImage.width,
        height * 0.88 / uploadedImage.height
    );

    const imageWidth = uploadedImage.width * scale;
    const imageHeight = uploadedImage.height * scale;

    const imageX = (width - imageWidth) / 2;
    const imageY = (height - imageHeight) / 2;

    photoBounds = {
        x: imageX,
        y: imageY,
        width: imageWidth,
        height: imageHeight
    };

    tempCtx.fillStyle = "#02030a";
    tempCtx.fillRect(0, 0, width, height);

    // Делаем фотографию чёрно-белой
    tempCtx.filter = "grayscale(1)";

    tempCtx.drawImage(
        uploadedImage,
        imageX,
        imageY,
        imageWidth,
        imageHeight
    );

    tempCtx.filter = "none";

    grayscaleImageCanvas = tempCanvas;

    // Получаем цвета фотографии
    const imageData = tempCtx.getImageData(
        0,
        0,
        width,
        height
    ).data;

    const candidates = [];

    // Собираем точки только внутри фотографии
    for (let y = Math.floor(imageY) + 3;
         y < imageY + imageHeight;
         y += 4) {

        for (let x = Math.floor(imageX) + 3;
             x < imageX + imageWidth;
             x += 4) {

            const index = (y * width + x) * 4;

            const red = imageData[index];
            const green = imageData[index + 1];
            const blue = imageData[index + 2];

            const brightness =
                red * 0.299 +
                green * 0.587 +
                blue * 0.114;

            if (brightness < 20) continue;

            candidates.push({
                x,
                y,
                color: [red, green, blue]
            });
        }
    }

    if (!candidates.length) {
        alert("Не удалось обработать фотографию.");
        return;
    }

    // Перемешиваем точки
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [candidates[i], candidates[j]] =
            [candidates[j], candidates[i]];
    }

    // Каждому слову назначаем точку фотографии
    portraitTargets = particles.map((particle, index) => {
        const candidateIndex = Math.floor(
            index * candidates.length / particles.length
        );

        const target = candidates[candidateIndex];

        // Сохраняем чёрно-белые оттенки
        const brighten = value =>
            Math.min(
                255,
                Math.round(value * 0.78 + 255 * 0.22)
            );

        const color = target.color;

        return {
            x: target.x,
            y: target.y,

            color: `rgb(
                ${brighten(color[0])},
                ${brighten(color[1])},
                ${brighten(color[2])}
            )`
        };
    });

    dragging = false;

    portraitMode = true;
    portraitFinished = false;

    portraitStartTime = performance.now();

    // Убираем управление галактикой
    document.getElementById("galaxyControls").style.display =
        "none";

    document.querySelector(".upload").style.display =
        "none";

    document.getElementById("createPortrait").style.display =
        "none";

    document.getElementById("universeDescription").textContent =
        "Слова собираются в твою фотографию...";

    document.getElementById("photoStatus").textContent =
        "Вселенная превращается в фотографию ✨";
}

document.getElementById("createPortrait")
    .addEventListener("click", createWordPortrait);


// =====================================
// 17. ПОСЛЕДНЕЕ ПИСЬМО
// =====================================

document.getElementById("toFinal")
    .addEventListener("click", () => {
        if (!portraitFinished) return;

        showScreen("finalScreen");
    });

function openLastLetter() {
    if (lastOpened) return;

    lastOpened = true;

    document
        .querySelector("#lastEnvelope .envelope")
        .classList.add("open");

    setTimeout(() => {
        document.getElementById("finalLetter").hidden = false;
        document.getElementById("openLast").hidden = true;

        document.getElementById("lastEnvelope").style.display =
            "none";
    }, 850);
}

document.getElementById("openLast")
    .addEventListener("click", openLastLetter);

document.getElementById("lastEnvelope")
    .addEventListener("click", openLastLetter);


// =====================================
// 18. НАЧАТЬ СНАЧАЛА
// =====================================

document.getElementById("restart")
    .addEventListener("click", () => {
        cancelAnimationFrame(animationId);

        animationId = null;

        particles = [];
        hazeParticles = [];
        dustParticles = [];
        dotParticles = [];
        allWords = [];

        portraitMode = false;
        portraitFinished = false;
        portraitTargets = [];

        grayscaleImageCanvas = null;
        photoBounds = null;

        rotation = 0;
        targetRotation = 0;

        tilt = BASE_TILT;
        targetTilt = BASE_TILT;

        zoom = 1;
        dragging = false;

        firstOpened = false;
        lastOpened = false;

        document.querySelectorAll(".envelope")
            .forEach(element => {
                element.classList.remove("open");
            });

        document.getElementById("finalLetter").hidden = true;
        document.getElementById("openLast").hidden = false;

        document.getElementById("lastEnvelope").style.display =
            "block";

        document.getElementById("wordInput").value = "";
        document.getElementById("photoInput").value = "";

        if (photoURL) {
            URL.revokeObjectURL(photoURL);
            photoURL = null;
        }

        uploadedImage = presetLoaded ? presetImage : null;

        document.getElementById("galaxyControls").style.display =
            "flex";

        document.querySelector(".upload").style.display =
            "inline-block";

        document.getElementById("createPortrait").style.display =
            "inline-block";

        document.getElementById("createPortrait").disabled = true;

        document.getElementById("toFinal").disabled = true;
        document.getElementById("toFinal").style.display = "none";

        document.getElementById("photoStatus").textContent =
            "Сначала выбери фотографию";

        document.getElementById("universeDescription").textContent =
            "Вращай галактику мышкой или пальцем";

        document.getElementById("translationStatus").textContent =
            "Создаём галактику...";

        showScreen("welcome");
    });