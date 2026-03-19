const wordData = {
    1: { // Week 1 (3/4 ~ 3/6)
        Wed: [
            { word: "balloon", meaning: "풍선", example: "I have a big balloon.", korEx: "나는 큰 풍선이 있어요." },
            { word: "bike", meaning: "자전거", example: "I ride my bike.", korEx: "나는 자전거를 타요." },
            { word: "doll", meaning: "인형", example: "The doll is cute.", korEx: "그 인형은 귀여워요." }
        ],
        Fri: [
            { word: "train", meaning: "기차", example: "The train is long.", korEx: "기차는 길어요." },
            { word: "robot", meaning: "로봇", example: "Look at my robot.", korEx: "내 로봇을 보세요." },
            { word: "teddy-bear", meaning: "곰인형", example: "I love my teddy-bear.", korEx: "나는 내 곰인형을 사랑해요." }
        ],
        Mon: [] // 3월 시작 전
    },
    2: { // Week 2 (3/9 ~ 3/13)
        Mon: [
            { word: "orange", meaning: "주황색", example: "The ball is orange.", korEx: "공은 주황색이에요." },
            { word: "pink", meaning: "분홍색", example: "I like pink flowers.", korEx: "나는 분홍색 꽃을 좋아해요." },
            { word: "brown", meaning: "갈색", example: "The bear is brown.", korEx: "그 곰은 갈색이에요." }
        ],
        Wed: [
            { word: "black", meaning: "검은색", example: "I have a black hat.", korEx: "나는 검은 모자가 있어요." },
            { word: "white", meaning: "하얀색", example: "The milk is white.", korEx: "우유는 하얀색이에요." },
            { word: "purple", meaning: "보라색", example: "I like purple grapes.", korEx: "나는 보라색 포도를 좋아해요." }
        ],
        Fri: [
            { word: "pencil", meaning: "연필", example: "I write with my pencil.", korEx: "나는 연필로 글을 써요." },
            { word: "crayon", meaning: "크레파스", example: "Color with your crayon.", korEx: "크레파스로 색칠하세요." }
        ]
    },
    3: { // Week 3 (3/16 ~ 3/20)
        Mon: [
            { word: "eraser", meaning: "지우개", example: "I have an eraser.", korEx: "나는 지우개가 있어요." },
            { word: "ruler", meaning: "자", example: "This is a long ruler.", korEx: "이것은 긴 자예요." }
        ],
        Wed: [
            { word: "pencil-case", meaning: "필통", example: "Put it in the pencil-case.", korEx: "그것을 필통에 넣으세요." },
            { word: "notebook", meaning: "공책", example: "Write on the notebook.", korEx: "공책에 쓰세요." }
        ],
        Fri: [
            { word: "desk", meaning: "책상", example: "The book is on the desk.", korEx: "책이 책상 위에 있어요." },
            { word: "chair", meaning: "의자", example: "Sit on the chair.", korEx: "의자에 앉으세요." }
        ]
    },
    4: { // Week 4 (3/23 ~ 3/27)
        Mon: [
            { word: "whiteboard", meaning: "화이트보드", example: "Look at the whiteboard.", korEx: "화이트보드를 보세요." },
            { word: "computer", meaning: "컴퓨터", example: "Use the computer.", korEx: "컴퓨터를 사용하세요." }
        ],
        Wed: [
            { word: "backpack", meaning: "배낭", example: "My backpack is heavy.", korEx: "내 배낭은 무거워요." },
            { word: "map", meaning: "지도", example: "Look at the map.", korEx: "지도를 보세요." }
        ],
        Fri: []
    }
};

const dateMapping = {
    1: { Mon: "3/2", Wed: "3/4", Fri: "3/6" },
    2: { Mon: "3/9", Wed: "3/11", Fri: "3/13" },
    3: { Mon: "3/16", Wed: "3/18", Fri: "3/20" },
    4: { Mon: "3/23", Wed: "3/25", Fri: "3/27" }
};

let userName = "나";
let currentWeek = 1;
let currentDay = 'Mon';
let adminCurrentWeek = 1;
let adminCurrentDay = 'Mon';
let usVoice = null;
let quizType = '';
let isMonthlyQuiz = false;
let isReviewMode = false;
let quizState = { index: 0, score: 0, items: [], selected: null, currentInput: "", wrongItems: [] };

function getAllMonthlyWords() {
    const allWords = [];
    Object.values(wordData).forEach(week => {
        Object.values(week).forEach(dayWords => {
            allWords.push(...dayWords);
        });
    });
    return allWords;
}

function startMonthlyQuizMenu() {
    const allWords = getAllMonthlyWords();
    if (allWords.length === 0) {
        alert("이번 달에 공부한 단어가 아직 없어요!");
        return;
    }
    isMonthlyQuiz = true;
    openQuizMenu();
}

function initVoices() {
    const voices = window.speechSynthesis.getVoices();
    usVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Natural')) ||
        voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
        voices.find(v => v.lang === 'en-US') ||
        voices[0];
}
window.speechSynthesis.onvoiceschanged = initVoices;

function speak(text, isExciting = false) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (usVoice) utterance.voice = usVoice;
    utterance.lang = 'en-US';

    if (isExciting) {
        utterance.pitch = 1.4;
        utterance.rate = 1.05;
    } else {
        utterance.pitch = 1.15;
        utterance.rate = 0.8;
    }
    window.speechSynthesis.speak(utterance);
}

function calculateCurrentDate() {
    const today = new Date();
    // 2026년 3월 기준 (월은 0부터 시작하므로 2가 3월)
    if (today.getFullYear() !== 2026 || today.getMonth() !== 2) {
        return { week: 1, day: 'Mon' };
    }

    const date = today.getDate();
    const dayOfWeek = today.getDay();

    let week = 1;
    if (date < 9) week = 1;
    else if (date < 16) week = 2;
    else if (date < 23) week = 3;
    else week = 4;

    let day = 'Mon';
    if (dayOfWeek === 1 || dayOfWeek === 2) day = 'Mon'; // 월, 화 -> Mon
    else if (dayOfWeek === 3 || dayOfWeek === 4) day = 'Wed'; // 수, 목 -> Wed
    else if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) day = 'Fri'; // 금, 토, 일 -> Fri

    return { week, day };
}

function startApp() {
    const input = document.getElementById('nameInput');
    if (input.value.trim() !== "") {
        userName = input.value.trim();
    }

    document.getElementById('displayUserName').innerText = userName;
    document.getElementById('nameEntryScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');

    speak("Welcome, " + userName + "! Let's study English!", true);

    // 오늘 날짜에 맞는 주차와 요일 자동 계산 및 탭 적용
    const initDate = calculateCurrentDate();
    switchWeek(initDate.week, initDate.day);
}

// --- 수정된 기능: 홈 버튼 클릭 시 단어 리스트 메인으로 이동 ---
function resetToHome() {
    // 퀴즈나 결과 화면 등 다른 화면에 있을 때만 확인 후 메인 리스트로 이동
    const isAtStudyView = !document.getElementById('studyView').classList.contains('hidden');

    if (isAtStudyView) {
        // 이미 메인 화면이라면 아무것도 하지 않음
        return;
    }

    window.speechSynthesis.cancel();
    isMonthlyQuiz = false; // Reset monthly flag

    // 모든 퀴즈 및 게임 관련 화면 숨기기
    document.getElementById('quizMenu').classList.add('hidden');
    document.getElementById('quizViewChoice').classList.add('hidden');
    document.getElementById('quizViewMatch').classList.add('hidden');
    document.getElementById('quizViewScramble').classList.add('hidden');
    document.getElementById('resultView').classList.add('hidden');

    // 메인 단어장 학습 화면 및 탭 보이기
    document.getElementById('studyView').classList.remove('hidden');
    document.getElementById('weekTabsContainer').classList.remove('hidden');
    document.getElementById('dayTabs').classList.remove('hidden');

    // 헤더 스타일 초기화
    document.getElementById('header').style.backgroundColor = '#3b82f6';
    document.getElementById('headerTitle').innerHTML = `<i class="fas fa-graduation-cap text-yellow-300 mr-2"></i>${userName}의 영어 단어장`;

    switchDay(currentDay);
}

// --- Admin Functions ---
function openAdmin() {
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('adminLoginScreen').classList.remove('hidden');
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminLoginError').classList.add('hidden');
}

function closeAdmin() {
    document.getElementById('adminLoginScreen').classList.add('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    switchWeek(currentWeek);
    switchDay(currentDay);
}

function loginAdmin() {
    const pwd = document.getElementById('adminPassword').value;
    if (pwd === "2222") {
        document.getElementById('adminLoginScreen').classList.add('hidden');
        document.getElementById('adminDashboard').classList.remove('hidden');
        switchAdminWeek('Week 1');
        switchAdminDay('Mon');
    } else {
        document.getElementById('adminLoginError').classList.remove('hidden');
    }
}

function switchAdminWeek(week) {
    adminCurrentWeek = week;
    document.querySelectorAll('#adminWeekTabs button').forEach(b => {
        if (b.innerText.trim() === 'Week ' + week) {
            b.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
            b.classList.remove('bg-white', 'text-gray-600', 'border-gray-300');
        } else {
            b.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
            b.classList.add('bg-white', 'text-gray-600', 'border-gray-300');
        }
    });

    // Update dates for admin day tabs
    if (dateMapping[week]) {
        document.getElementById('adminDateMon').innerText = dateMapping[week].Mon;
        document.getElementById('adminDateWed').innerText = dateMapping[week].Wed;
        document.getElementById('adminDateFri').innerText = dateMapping[week].Fri;
    }

    switchAdminDay('Mon');
}

function switchAdminDay(day) {
    adminCurrentDay = day;
    document.querySelectorAll('#adminDayTabs button').forEach(b => {
        if (b.id === 'adminTab' + day) {
            b.classList.add('bg-gray-800', 'text-white', 'border-gray-800', 'tab-active');
            b.classList.remove('bg-white', 'text-gray-600', 'border-gray-300');
        } else {
            b.classList.remove('bg-gray-800', 'text-white', 'border-gray-800', 'tab-active');
            b.classList.add('bg-white', 'text-gray-600', 'border-gray-300');
        }
    });
    renderAdminList();
}

function renderAdminList() {
    const list = document.getElementById('adminWordList');
    list.innerHTML = '';
    const currentList = wordData[adminCurrentWeek][adminCurrentDay];

    if (currentList.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-500 mt-4">단어가 없습니다.</p>';
        return;
    }

    currentList.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center p-3 border-b mb-2 bg-gray-50 rounded-lg';
        div.innerHTML = `
            <div>
                <p class="font-bold">${item.word} <span class="text-sm font-normal text-gray-500">(${item.meaning})</span></p>
                <p class="text-xs text-gray-400 truncate max-w-[200px]">${item.example}</p>
            </div>
            <button onclick="deleteWord(${index})" class="text-red-500 p-2 hover:bg-red-50 rounded"><i class="fas fa-trash"></i></button>
        `;
        list.appendChild(div);
    });
}

function addWord() {
    const word = document.getElementById('newWord').value.trim();
    const meaning = document.getElementById('newMeaning').value.trim();
    const example = document.getElementById('newExample').value.trim() || 'No example';
    const korEx = document.getElementById('newKorEx').value.trim() || '예문 없음';

    if (!word || !meaning) {
        alert("단어와 뜻은 필수입니다.");
        return;
    }

    wordData[adminCurrentWeek][adminCurrentDay].push({ word, meaning, example, korEx });

    document.getElementById('newWord').value = '';
    document.getElementById('newMeaning').value = '';
    document.getElementById('newExample').value = '';
    document.getElementById('newKorEx').value = '';

    renderAdminList();
}

function deleteWord(index) {
    if (confirm("정말 삭제하시겠습니까?")) {
        wordData[adminCurrentWeek][adminCurrentDay].splice(index, 1);
        renderAdminList();
    }
}

function switchWeek(week, forceDay = 'Mon') {
    currentWeek = week;
    document.querySelectorAll('#weekTabs button').forEach(b => {
        if (b.innerText.trim() === 'Week ' + week) {
            b.classList.add('bg-blue-600', 'text-white', 'border-transparent');
            b.classList.remove('bg-white', 'text-blue-600', 'border-blue-200');
        } else {
            b.classList.remove('bg-blue-600', 'text-white', 'border-transparent');
            b.classList.add('bg-white', 'text-blue-600', 'border-blue-200');
        }
    });

    // Update dates for main day tabs
    if (dateMapping[week]) {
        document.getElementById('dateMon').innerText = dateMapping[week].Mon;
        document.getElementById('dateWed').innerText = dateMapping[week].Wed;
        document.getElementById('dateFri').innerText = dateMapping[week].Fri;
    }

    switchDay(forceDay);
}

function switchDay(day) {
    currentDay = day;
    document.querySelectorAll('#dayTabs button').forEach(b => {
        if (b.id === 'tab' + day) {
            b.classList.add('bg-blue-600', 'text-white', 'border-transparent', 'tab-active');
            b.classList.remove('bg-white', 'text-blue-600', 'border-blue-200');
        } else {
            b.classList.remove('bg-blue-600', 'text-white', 'border-transparent', 'tab-active');
            b.classList.add('bg-white', 'text-blue-600', 'border-blue-200');
        }
    });


    const list = document.getElementById('wordList');
    list.innerHTML = '';

    const currentList = wordData[currentWeek][currentDay];

    if (currentList.length === 0) {
        list.innerHTML = '<div class="text-center py-10"><p class="text-gray-500 font-bold mb-2">🎉 휴식 시간입니다! 🎉</p><p class="text-sm text-gray-400">오늘은 외워야 할 단어가 없어요.</p></div>';
        return;
    }

    currentList.forEach((item, i) => {
        const card = document.createElement('div');
        card.className = 'word-card bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-sm space-y-4';
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h2 class="text-3xl font-black text-gray-800 lowercase">${item.word}</h2>
                    <p class="text-blue-600 font-bold">${item.meaning}</p>
                </div>
                <button onclick="speak('${item.word}')" class="bg-blue-100 text-blue-600 p-3 rounded-full hover:bg-blue-200 transition-colors shadow-sm">
                    <i class="fas fa-volume-up"></i>
                </button>
            </div>
            
            <div class="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-400">
                <div class="flex justify-between items-center mb-1">
                    <p class="text-gray-700 font-bold italic">"${item.example}"</p>
                    <button onclick="speak('${item.example.replace(/'/g, "\\'")}')" class="text-blue-400 hover:text-blue-600 ml-2">
                        <i class="fas fa-play-circle text-lg"></i>
                    </button>
                </div>
                <p class="text-gray-500 text-sm font-medium">${item.korEx}</p>
            </div>
        `;
        list.appendChild(card);
    });
}

function openQuizMenu() {
    const currentList = isMonthlyQuiz ? getAllMonthlyWords() : wordData[currentWeek][currentDay];
    if (currentList.length === 0) {
        alert("게임할 단어가 없어요!");
        return;
    }

    document.getElementById('studyView').classList.add('hidden');
    document.getElementById('quizMenu').classList.remove('hidden');
    document.getElementById('weekTabsContainer').classList.add('hidden');
    document.getElementById('dayTabs').classList.add('hidden');

    const menuTitle = isMonthlyQuiz ? "🏆 월간 종합 테스트 🏆" : "어떤 모험을 떠날까요?";
    document.querySelector('#quizMenu h3').innerText = menuTitle;
}

function exitQuiz() {
    document.getElementById('studyView').classList.remove('hidden');
    document.querySelectorAll('[id^="quizView"], #quizMenu, #resultView').forEach(el => el.classList.add('hidden'));
    document.getElementById('weekTabsContainer').classList.remove('hidden');
    document.getElementById('dayTabs').classList.remove('hidden');
    document.getElementById('header').style.backgroundColor = '#3b82f6';
    document.getElementById('headerTitle').innerHTML = `<i class="fas fa-graduation-cap text-yellow-300 mr-2"></i>${userName}의 영어 단어장`;
    isMonthlyQuiz = false; // Reset monthly flag
    isReviewMode = false; // Reset review flag
    switchDay(currentDay);
}

function startQuiz(type) {
    quizType = type;
    quizState.index = 0;
    quizState.score = 0;
    quizState.wrongItems = [];
    isReviewMode = false;
    document.getElementById('quizMenu').classList.add('hidden');

    let words = isMonthlyQuiz ? getAllMonthlyWords() : [...wordData[currentWeek][currentDay]];

    // 월간 테스트라면 랜덤하게 20단어만 선택 (너무 많으면 힘드니까요)
    if (isMonthlyQuiz && words.length > 20) {
        words = words.sort(() => Math.random() - 0.5).slice(0, 20);
    } else {
        words = words.sort(() => Math.random() - 0.5);
    }

    quizState.items = words;

    if (type === 'choice') {
        document.getElementById('quizViewChoice').classList.remove('hidden');
        document.getElementById('header').style.backgroundColor = '#3b82f6';
        renderChoice();
    } else if (type === 'match') {
        document.getElementById('quizViewMatch').classList.remove('hidden');
        document.getElementById('header').style.backgroundColor = '#22c55e';
        renderMatch();
    } else if (type === 'scramble') {
        document.getElementById('quizViewScramble').classList.remove('hidden');
        document.getElementById('header').style.backgroundColor = '#a855f7';
        renderScramble();
    }
}

function renderChoice() {
    const item = quizState.items[quizState.index];
    document.getElementById('choiceWord').innerText = item.word.toLowerCase();
    document.getElementById('choiceInfo').innerHTML = `<span class="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">${quizState.index + 1} / ${quizState.items.length}</span>`;
    document.getElementById('choiceSpeakBtn').onclick = () => speak(item.word);

    let opts = [item.meaning];

    // 오답 선택지를 가져오기 위해 모든 단어를 모음
    const allWords = [];
    Object.values(wordData).forEach(week => {
        Object.values(week).forEach(day => {
            allWords.push(...day);
        });
    });

    const others = allWords.map(i => i.meaning).filter(m => m !== item.meaning);
    // 중복 제거 후 섞기
    const uniqueOthers = [...new Set(others)];
    opts.push(...uniqueOthers.sort(() => Math.random() - 0.5).slice(0, 2));
    opts.sort(() => Math.random() - 0.5);

    const container = document.getElementById('choiceOptions');
    container.innerHTML = '';
    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option w-full bg-white border-2 border-gray-100 py-4 rounded-2xl font-bold text-gray-700 hover:border-blue-400';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt === item.meaning);
        container.appendChild(btn);
    });
}

function renderMatch() {
    const currentWords = quizState.items;
    let cards = [];
    currentWords.forEach((w, i) => {
        cards.push({ id: i, text: w.word.toLowerCase(), type: 'en' });
        cards.push({ id: i, text: w.meaning, type: 'ko' });
    });
    cards.sort(() => Math.random() - 0.5);

    const grid = document.getElementById('matchGrid');
    grid.innerHTML = '';
    cards.forEach(card => {
        const div = document.createElement('div');
        div.className = 'match-card bg-white border-2 border-gray-200 p-4 rounded-xl text-center font-bold text-gray-700 shadow-sm flex items-center justify-center min-h-[80px]';
        div.innerText = card.text;
        div.onclick = () => handleMatchClick(card, div);
        grid.appendChild(div);
    });
    quizState.matchedCount = 0;
    quizState.totalPairs = currentWords.length;
}


function handleMatchClick(card, element) {
    if (element.classList.contains('match-correct')) return;
    if (quizState.selected && quizState.selected.element === element) return;

    element.classList.add('match-selected');

    if (!quizState.selected) {
        quizState.selected = { card, element };
    } else {
        const first = quizState.selected;
        if (first.card.id === card.id && first.card.type !== card.type) {
            const colorClass = `matched-color-${card.id % 5}`;
            setTimeout(() => {
                element.classList.remove('match-selected');
                first.element.classList.remove('match-selected');
                element.classList.add('match-correct', colorClass);
                first.element.classList.add('match-correct', colorClass);

                quizState.matchedCount++;
                quizState.score++; // 점수 추가
                if (quizState.matchedCount === quizState.totalPairs) {
                    setTimeout(showResult, 1000);
                }
            }, 200);

            const cheers = ["Yes!", "Good job!", "Perfect!", "Wow!", "Nice!"];
            const randomCheer = cheers[Math.floor(Math.random() * cheers.length)];
            speak(randomCheer, true);
            showFeedback(true);
        } else {
            setTimeout(() => {
                element.classList.remove('match-selected');
                first.element.classList.remove('match-selected');
            }, 500);
            showFeedback(false);
            speak("Try again!", false);
        }
        quizState.selected = null;
    }
}

function renderScramble() {
    const item = quizState.items[quizState.index];
    quizState.currentInput = "";
    document.getElementById('scrambleMeaning').innerText = item.meaning;
    document.getElementById('scrambleDisplay').innerText = "";
    document.getElementById('scrambleSpeakBtn').onclick = () => speak(item.word);

    const letters = item.word.toLowerCase().split('').sort(() => Math.random() - 0.5);
    const container = document.getElementById('scrambleLetters');
    container.innerHTML = '';
    letters.forEach((l, i) => {
        const btn = document.createElement('button');
        btn.className = 'letter-card w-12 h-12 bg-white border-2 border-purple-200 rounded-xl font-black text-xl text-purple-600 shadow-sm lowercase';
        btn.innerText = l;
        btn.onclick = () => {
            // 철자 클릭 시 해당 알파벳 발음 재생
            speak(l);

            quizState.currentInput += l;
            document.getElementById('scrambleDisplay').innerText = quizState.currentInput.toLowerCase();
            btn.style.visibility = 'hidden';
            if (quizState.currentInput.length === item.word.length) {
                checkAnswer(quizState.currentInput.toLowerCase() === item.word.toLowerCase());
            }
        };
        container.appendChild(btn);
    });
}

function resetScramble() {
    renderScramble();
}

function checkAnswer(isCorrect) {
    showFeedback(isCorrect);
    const item = quizState.items[quizState.index];

    if (isCorrect) {
        quizState.score++;
        const greatCheers = ["Amazing!", "You're a genius!", "Unbelievable!", "Great job!", "So smart!"];
        const randomGreat = greatCheers[Math.floor(Math.random() * greatCheers.length)];
        speak(randomGreat, true);
    } else {
        if (isMonthlyQuiz || isReviewMode) {
            quizState.wrongItems.push(item);
        }
        speak("It's okay!", false);
    }

    if (quizType !== 'match') {
        // 월간 테스트거나 리뷰 모드면 틀려도 다음으로 넘어감
        const shouldSkip = isMonthlyQuiz || isReviewMode;
        console.log("checkAnswer - isCorrect:", isCorrect, "isMonthlyQuiz:", isMonthlyQuiz, "isReviewMode:", isReviewMode, "shouldSkip:", shouldSkip);
        
        if (isCorrect || shouldSkip) {
            setTimeout(() => {
                if (quizState.index < quizState.items.length - 1) {
                    quizState.index++;
                    console.log("Moving to next question:", quizState.index);
                    quizType === 'choice' ? renderChoice() : renderScramble();
                } else {
                    console.log("No more questions, showing results.");
                    showResult();
                }
            }, 1000);
        } else {
            // 일일 퀴즈는 오답 시 해당 문제에 머물며 다시 풀기 (스캐램블 전용)
            if (quizType === 'scramble') {
                setTimeout(resetScramble, 800);
            }
        }
    }
}

function showFeedback(isCorrect) {
    const fb = document.getElementById('feedback');
    const icon = document.getElementById('feedbackIcon');
    icon.innerText = isCorrect ? "⭕" : "❌";
    icon.className = isCorrect ? "text-green-500 correct-anim text-9xl" : "text-red-500 text-9xl";
    fb.classList.remove('opacity-0');
    setTimeout(() => fb.classList.add('opacity-0'), 700);
}

function showResult() {
    document.querySelectorAll('[id^="quizView"]').forEach(el => el.classList.add('hidden'));
    document.getElementById('resultView').classList.remove('hidden');

    const totalQuestions = quizState.items.length;
    const finalScore = quizState.score;

    const resultMsg = isMonthlyQuiz
        ? `한 달 동안 배운 단어 중 ${totalQuestions}개를 테스트했어요!`
        : `오늘 공부도 완벽하게 성공!`;
    
    document.querySelector('#resultView p').innerText = resultMsg;
    document.getElementById('finalScoreDisplay').innerHTML = `
        <div class="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6 mb-8 text-center shadow-inner">
            <h3 class="text-gray-500 font-bold mb-1">나의 점수는?</h3>
            <div class="text-6xl font-black text-blue-600 mb-2">
                ${finalScore} / ${totalQuestions}
            </div>
            <p class="text-blue-400 font-bold">정답을 맞혔어요! 짝짝짝!</p>
        </div>
    `;

    // 틀린 문제가 있으면 다시 풀기 버튼 추가
    if (quizState.wrongItems.length > 0) {
        const retryBtn = document.createElement('button');
        retryBtn.className = "w-full bg-red-400 hover:bg-red-500 text-white font-black py-4 rounded-2xl shadow-lg text-lg mb-4 transition-transform active:scale-95 flex items-center justify-center gap-2";
        retryBtn.innerHTML = `<i class="fas fa-redo"></i> 틀린 문제 다시 풀기 (${quizState.wrongItems.length})`;
        retryBtn.onclick = startReviewQuiz;
        document.getElementById('finalScoreDisplay').appendChild(retryBtn);
    }

    speak("Wow! You finished everything! You are an English superstar!", true);
}

function startReviewQuiz() {
    isReviewMode = true;
    quizState.items = [...quizState.wrongItems];
    quizState.wrongItems = [];
    quizState.index = 0;
    quizState.score = 0;
    
    document.getElementById('resultView').classList.add('hidden');
    if (quizType === 'choice') {
        document.getElementById('quizViewChoice').classList.remove('hidden');
        renderChoice();
    } else if (quizType === 'scramble') {
        document.getElementById('quizViewScramble').classList.remove('hidden');
        renderScramble();
    } else {
        // 매치는 일단 패스하거나 전체 다시 풀기
        startQuiz(quizType);
    }
}

window.onload = () => {
    initVoices();

    // 첫 화면 이름 입력 시 엔터 키로 바로 시작
    document.getElementById('nameInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            startApp();
        }
    });

    // 관리자 로그인 시 엔터 키로 바로 로그인
    document.getElementById('adminPassword').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            loginAdmin();
        }
    });
};
