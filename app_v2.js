console.log('app_v2.js: Loading start...');
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3005/api'
    : '/api';

function getLocalDateString(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

let wordData = {
    1: { Mon: [], Wed: [], Fri: [] },
    2: { Mon: [], Wed: [], Fri: [] },
    3: { Mon: [], Wed: [], Fri: [] },
    4: { Mon: [], Wed: [], Fri: [] }
};
let rawWords = [];

async function fetchAllWords() {
    const hardcoded = [
        {
            id: 99991,
            study_date: '2026-06-29',
            week: 1,
            day: 'Mon',
            word: 'swim tube',
            meaning: '튜브',
            example: 'I float on my blue swim tube.',
            korEx: '나는 파란 튜브를 타고 물에 둥둥 떠 있어요.'
        },
        {
            id: 99992,
            study_date: '2026-06-29',
            week: 1,
            day: 'Mon',
            word: 'water gun',
            meaning: '물총',
            example: 'We play with a water gun in the yard.',
            korEx: '우리는 마당에서 물총을 가지고 놀아요.'
        },
        {
            id: 99993,
            study_date: '2026-06-29',
            week: 1,
            day: 'Mon',
            word: 'boat',
            meaning: '보트',
            example: 'The little boat moves on the river.',
            korEx: '작은 배가 강 위를 움직여요.'
        }
    ];

    try {
        const response = await fetch(`${API_URL}/words`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        const fetchedIds = new Set(data.map(item => item.word?.toLowerCase()));
        const uniqueHardcoded = hardcoded.filter(item => !fetchedIds.has(item.word?.toLowerCase()));
        rawWords = [...uniqueHardcoded, ...data];
        
        console.log('Data synced from DB');
    } catch (err) {
        console.error('Error fetching words, using hardcoded fallback:', err);
        rawWords = hardcoded;
    }

    // Reset wordData
    wordData = {
        1: { Mon: [], Wed: [], Fri: [] },
        2: { Mon: [], Wed: [], Fri: [] },
        3: { Mon: [], Wed: [], Fri: [] },
        4: { Mon: [], Wed: [], Fri: [] }
    };
    
    rawWords.forEach(item => {
        if (wordData[item.week] && wordData[item.week][item.day]) {
            wordData[item.week][item.day].push({
                id: item.id,
                word: item.word,
                meaning: item.meaning,
                example: item.example,
                korEx: item.korEx,
                study_date: item.study_date
            });
        }
    });
}

function generateDateMapping(year, month) {
    const mapping = {
        1: { Mon: null, Wed: null, Fri: null },
        2: { Mon: null, Wed: null, Fri: null },
        3: { Mon: null, Wed: null, Fri: null },
        4: { Mon: null, Wed: null, Fri: null }
    };

    function getStartMonday(y, m) {
        const first = new Date(y, m, 1);
        const dayOfWeek = first.getDay();
        if (dayOfWeek === 0) {
            return new Date(y, m, 2);
        } else {
            return new Date(y, m, 1 - (dayOfWeek - 1));
        }
    }

    const startMonday = getStartMonday(year, month);

    for (let week = 1; week <= 4; week++) {
        const monDate = new Date(startMonday.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
        const wedDate = new Date(monDate.getTime() + 2 * 24 * 60 * 60 * 1000);
        const friDate = new Date(monDate.getTime() + 4 * 24 * 60 * 60 * 1000);

        mapping[week].Mon = {
            label: `${monDate.getMonth() + 1}/${monDate.getDate()}`,
            dateStr: getLocalDateString(monDate)
        };
        mapping[week].Wed = {
            label: `${wedDate.getMonth() + 1}/${wedDate.getDate()}`,
            dateStr: getLocalDateString(wedDate)
        };
        mapping[week].Fri = {
            label: `${friDate.getMonth() + 1}/${friDate.getDate()}`,
            dateStr: getLocalDateString(friDate)
        };
    }

    return mapping;
}

let dateMapping = generateDateMapping(new Date().getFullYear(), new Date().getMonth());

let userName = "나";
let userId = null; // 신규: DB 유저 ID 저장을 위한 변수
let currentWeek = 1;
let currentDay = 'Mon';
let adminSelectedDate = getLocalDateString(new Date());
let adminCurrentWeek = 1;
let adminCurrentDay = 'Mon';
let usVoice = null;
let quizType = '';
let isMonthlyQuiz = false;
let isReviewMode = false;
let quizState = { index: 0, score: 0, items: [], selected: null, currentInput: "", wrongItems: [] };

function getAllMonthlyWords() {
    return rawWords;
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

function getWeekAndDayFromDate(dateStr) {
    if (!dateStr) return { week: 1, day: 'Mon' };
    const parts = dateStr.split('T')[0].split(' ')[0].split('-');
    if (parts.length < 3) return { week: 1, day: 'Mon' };
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (isNaN(dateObj.getTime())) return { week: 1, day: 'Mon' };

    function getStartMonday(y, m) {
        const first = new Date(y, m, 1);
        const dayOfWeek = first.getDay();
        if (dayOfWeek === 0) {
            return new Date(y, m, 2);
        } else {
            return new Date(y, m, 1 - (dayOfWeek - 1));
        }
    }

    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();

    // Check if this date belongs to the NEXT month's Week 1
    const nextMonthDate = new Date(year, month + 1, 1);
    const nextStartMonday = getStartMonday(nextMonthDate.getFullYear(), nextMonthDate.getMonth());
    
    let startMonday;
    if (dateObj >= nextStartMonday) {
        startMonday = nextStartMonday;
    } else {
        const currStartMonday = getStartMonday(year, month);
        if (dateObj < currStartMonday) {
            const prevMonthDate = new Date(year, month - 1, 1);
            startMonday = getStartMonday(prevMonthDate.getFullYear(), prevMonthDate.getMonth());
        } else {
            startMonday = currStartMonday;
        }
    }

    const diffTime = dateObj.getTime() - startMonday.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let week = 1;
    if (diffDays < 7) week = 1;
    else if (diffDays < 14) week = 2;
    else if (diffDays < 21) week = 3;
    else week = 4;

    const dayOfWeek = dateObj.getDay();
    let day = 'Mon';
    if (dayOfWeek === 1 || dayOfWeek === 2) day = 'Mon';
    else if (dayOfWeek === 3 || dayOfWeek === 4) day = 'Wed';
    else day = 'Fri';

    return { week, day };
}

async function startApp() {
    const input = document.getElementById('nameInput');
    if (input.value.trim() !== "") {
        userName = input.value.trim();
    }

    // 신규: 서버에 유저 등록/로그인 요청
    try {
        const userRes = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: userName })
        });
        const userData = await userRes.json();
        userId = userData.user_id;
        console.log('User logged in with ID:', userId);
    } catch (err) {
        console.error('Error logging in user:', err);
    }

    document.getElementById('displayUserName').innerText = userName;
    document.getElementById('nameEntryScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');

    speak("Welcome, " + userName + "! Let's study English!", true);

    // 오늘 날짜에 맞는 주차와 요일 자동 계산 및 탭 적용
    const today = new Date();
    const todayStr = getLocalDateString(today);
    const initDate = getWeekAndDayFromDate(todayStr);
    
    // 현재 월에 해당하는 dateMapping 생성 및 업데이트
    dateMapping = generateDateMapping(today.getFullYear(), today.getMonth());

    // 초기 데이터 로딩 후 앱 시작
    fetchAllWords().then(() => {
        switchWeek(initDate.week, initDate.day);
    });
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
        
        // 초기 날짜 설정 (오늘 날짜)
        const today = new Date();
        const initialDate = getLocalDateString(today);
        
        document.getElementById('adminDateInput').value = initialDate;
        syncAdminDate();
    } else {
        document.getElementById('adminLoginError').classList.remove('hidden');
    }
}

function syncAdminDate() {
    const dateStr = document.getElementById('adminDateInput').value;
    if (!dateStr) return;

    adminSelectedDate = dateStr;
    const { week, day } = getWeekAndDayFromDate(dateStr);
    adminCurrentWeek = week;
    adminCurrentDay = day;

    document.getElementById('selectedDateDisplay').innerText = `${dateStr} (Week ${week}, ${day})`;
    renderAdminList();
}

async function suggestWordData() {
    const wordInput = document.getElementById('newWord');
    const word = wordInput.value.trim();
    if (!word) {
        alert("원하는 단어를 먼저 입력해주세요!");
        return;
    }

    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 생성 중...`;
    btn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/suggest-word`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word })
        });
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        document.getElementById('newMeaning').value = data.meaning;
        document.getElementById('newExample').value = data.example;
        document.getElementById('newKorEx').value = data.korEx;
        
        speak(`Suggestion for ${word} is ready!`, true);
    } catch (err) {
        console.error('Error suggesting word:', err);
        alert('추천 데이터를 가져오지 못했습니다.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
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
        document.getElementById('adminDateMon').innerText = dateMapping[week].Mon.label;
        document.getElementById('adminDateWed').innerText = dateMapping[week].Wed.label;
        document.getElementById('adminDateFri').innerText = dateMapping[week].Fri.label;
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
    
    // Filter rawWords by the selected date YYYY-MM-DD
    const currentList = rawWords.filter(item => {
        if (!item.study_date) return false;
        const itemDate = item.study_date.split('T')[0].split(' ')[0];
        const selectedDate = adminSelectedDate.split('T')[0].split(' ')[0];
        return itemDate === selectedDate;
    });

    if (currentList.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-500 mt-4">이 날짜에 등록된 단어가 없습니다.</p>';
        return;
    }

    currentList.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center p-3 border-b mb-2 bg-gray-50 rounded-lg';
        div.innerHTML = `
            <div>
                <p class="font-bold">${item.word} <span class="text-sm font-normal text-gray-500">(${item.meaning})</span></p>
                <p class="text-xs text-gray-400 truncate max-w-[200px]">${item.example}</p>
            </div>
            <button onclick="deleteWord(${item.id})" class="text-red-500 p-2 hover:bg-red-50 rounded"><i class="fas fa-trash"></i></button>
        `;
        list.appendChild(div);
    });
}

async function addWord() {
    const word = document.getElementById('newWord').value.trim();
    const meaning = document.getElementById('newMeaning').value.trim();
    const example = document.getElementById('newExample').value.trim() || 'No example';
    const korEx = document.getElementById('newKorEx').value.trim() || '예문 없음';

    if (!word || !meaning) {
        alert("단어와 뜻은 필수입니다.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/words`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                week: adminCurrentWeek,
                day: adminCurrentDay,
                word,
                meaning,
                example,
                korEx,
                study_date: adminSelectedDate
            })
        });

        if (response.ok) {
            await fetchAllWords(); // Sync local data
            document.getElementById('newWord').value = '';
            document.getElementById('newMeaning').value = '';
            document.getElementById('newExample').value = '';
            document.getElementById('newKorEx').value = '';
            renderAdminList();
        } else {
            alert('단어 추가 실패');
        }
    } catch (err) {
        console.error('Error adding word:', err);
    }
}

async function deleteWord(id) {
    if (confirm("정말 삭제하시겠습니까?")) {
        try {
            const response = await fetch(`${API_URL}/words/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchAllWords(); // Sync local data
                renderAdminList();
            } else {
                alert('단어 삭제 실패');
            }
        } catch (err) {
            console.error('Error deleting word:', err);
        }
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
        document.getElementById('dateMon').innerText = dateMapping[week].Mon.label;
        document.getElementById('dateWed').innerText = dateMapping[week].Wed.label;
        document.getElementById('dateFri').innerText = dateMapping[week].Fri.label;
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

    const activeDateStr = dateMapping[currentWeek][currentDay].dateStr;
    const currentList = rawWords.filter(item => {
        if (!item.study_date) return false;
        return item.study_date.split('T')[0].split(' ')[0] === activeDateStr;
    });

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
    const activeDateStr = dateMapping[currentWeek][currentDay].dateStr;
    const currentList = isMonthlyQuiz 
        ? getAllMonthlyWords() 
        : rawWords.filter(item => {
            if (!item.study_date) return false;
            return item.study_date.split('T')[0].split(' ')[0] === activeDateStr;
        });
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

    const activeDateStr = dateMapping[currentWeek][currentDay].dateStr;
    let words = isMonthlyQuiz 
        ? getAllMonthlyWords() 
        : rawWords.filter(item => {
            if (!item.study_date) return false;
            return item.study_date.split('T')[0].split(' ')[0] === activeDateStr;
        });

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
    const allWords = getAllMonthlyWords();

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

async function showResult() {
    document.querySelectorAll('[id^="quizView"]').forEach(el => el.classList.add('hidden'));
    document.getElementById('resultView').classList.remove('hidden');

    const totalQuestions = quizState.items.length;
    const finalScore = quizState.score;

    const resultMsg = isMonthlyQuiz
        ? `한 달 동안 배운 단어 중 ${totalQuestions}개를 테스트했어요!`
        : `오늘 공부도 완벽하게 성공!`;

    // 신규: 퀴즈 결과 DB 저장 (리뷰 모드 제외)
    if (!isReviewMode && userId) {
        try {
            await fetch(`${API_URL}/quiz-history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    quiz_type: quizType,
                    score: finalScore
                })
            });
            console.log('Quiz history saved');
        } catch (err) {
            console.error('Error saving quiz history:', err);
        }
    }

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
console.log('app_v2.js: Loading complete!');
