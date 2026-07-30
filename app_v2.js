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

function detectCycles(words) {
    const validWords = words.filter(w => w.study_date && w.week && w.day);
    validWords.sort((a, b) => a.study_date.localeCompare(b.study_date));
    
    const cycles = [];
    let currentCycle = [];
    
    for (let i = 0; i < validWords.length; i++) {
        const item = validWords[i];
        const prevItem = currentCycle[currentCycle.length - 1];
        
        let startNewCycle = false;
        if (currentCycle.length === 0) {
            startNewCycle = true;
        } else {
            const weekDecreased = item.week < prevItem.week;
            const currentDate = new Date(item.study_date);
            const prevDate = new Date(prevItem.study_date);
            const gapDays = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
            
            if (weekDecreased || gapDays > 14) {
                startNewCycle = true;
            }
        }
        
        if (startNewCycle) {
            if (currentCycle.length > 0) {
                cycles.push(currentCycle);
            }
            currentCycle = [item];
        } else {
            currentCycle.push(item);
        }
    }
    
    if (currentCycle.length > 0) {
        cycles.push(currentCycle);
    }
    
    return cycles;
}

function getActiveCycle(cycles, todayStr) {
    if (cycles.length === 0) return null;
    
    // Find if today falls inside any cycle's range
    for (const cycle of cycles) {
        const minDate = cycle[0].study_date;
        const maxDate = cycle[cycle.length - 1].study_date;
        if (todayStr >= minDate && todayStr <= maxDate) {
            return cycle;
        }
    }
    
    // If today is before the first cycle
    if (todayStr < cycles[0][0].study_date) {
        return cycles[0];
    }
    
    // If today is after the last cycle
    const lastCycle = cycles[cycles.length - 1];
    if (todayStr > lastCycle[lastCycle.length - 1].study_date) {
        return lastCycle;
    }
    
    // Otherwise find closest cycle
    let closestCycle = cycles[0];
    let minDiff = Infinity;
    
    for (const cycle of cycles) {
        const start = new Date(cycle[0].study_date);
        const end = new Date(cycle[cycle.length - 1].study_date);
        const today = new Date(todayStr);
        
        let diff = 0;
        if (today < start) {
            diff = (start - today) / (1000 * 60 * 60 * 24);
        } else if (today > end) {
            diff = (today - end) / (1000 * 60 * 60 * 24);
        }
        
        if (diff < minDiff) {
            minDiff = diff;
            closestCycle = cycle;
        }
    }
    
    return closestCycle;
}

async function fetchAllWords() {
    const hardcoded = [
        {
            id: 1,
            study_date: '2026-03-04',
            week: 1,
            day: 'Wed',
            word: "balloon",
            meaning: "풍선",
            example: "I have a big balloon.",
            korEx: "나는 큰 풍선이 있어요."
        },
        {
            id: 2,
            study_date: '2026-03-04',
            week: 1,
            day: 'Wed',
            word: "bike",
            meaning: "자전거",
            example: "I ride my bike.",
            korEx: "나는 자전거를 타요."
        },
        {
            id: 3,
            study_date: '2026-03-04',
            week: 1,
            day: 'Wed',
            word: "doll",
            meaning: "인형",
            example: "The doll is cute.",
            korEx: "그 인형은 귀여워요."
        },
        {
            id: 4,
            study_date: '2026-03-06',
            week: 1,
            day: 'Fri',
            word: "train",
            meaning: "기차",
            example: "The train is long.",
            korEx: "기차는 길어요."
        },
        {
            id: 5,
            study_date: '2026-03-06',
            week: 1,
            day: 'Fri',
            word: "robot",
            meaning: "로봇",
            example: "Look at my robot.",
            korEx: "내 로봇을 보세요."
        },
        {
            id: 6,
            study_date: '2026-03-06',
            week: 1,
            day: 'Fri',
            word: "teddy-bear",
            meaning: "곰인형",
            example: "I love my teddy-bear.",
            korEx: "나는 내 곰인형을 사랑해요."
        },
        {
            id: 7,
            study_date: '2026-03-09',
            week: 2,
            day: 'Mon',
            word: "orange",
            meaning: "주황색",
            example: "The ball is orange.",
            korEx: "공은 주황색이에요."
        },
        {
            id: 8,
            study_date: '2026-03-09',
            week: 2,
            day: 'Mon',
            word: "pink",
            meaning: "분홍색",
            example: "I like pink flowers.",
            korEx: "나는 분홍색 꽃을 좋아해요."
        },
        {
            id: 9,
            study_date: '2026-03-09',
            week: 2,
            day: 'Mon',
            word: "brown",
            meaning: "갈색",
            example: "The bear is brown.",
            korEx: "그 곰은 갈색이에요."
        },
        {
            id: 10,
            study_date: '2026-03-11',
            week: 2,
            day: 'Wed',
            word: "black",
            meaning: "검은색",
            example: "I have a black hat.",
            korEx: "나는 검은 모자가 있어요."
        },
        {
            id: 11,
            study_date: '2026-03-11',
            week: 2,
            day: 'Wed',
            word: "white",
            meaning: "하얀색",
            example: "The milk is white.",
            korEx: "우유는 하얀색이에요."
        },
        {
            id: 12,
            study_date: '2026-03-11',
            week: 2,
            day: 'Wed',
            word: "purple",
            meaning: "보라색",
            example: "I like purple grapes.",
            korEx: "나는 보라색 포도를 좋아해요."
        },
        {
            id: 13,
            study_date: '2026-03-13',
            week: 2,
            day: 'Fri',
            word: "pencil",
            meaning: "연필",
            example: "I write with my pencil.",
            korEx: "나는 연필로 글을 써요."
        },
        {
            id: 14,
            study_date: '2026-03-13',
            week: 2,
            day: 'Fri',
            word: "crayon",
            meaning: "크레파스",
            example: "Color with your crayon.",
            korEx: "크레파스로 색칠하세요."
        },
        {
            id: 15,
            study_date: '2026-03-16',
            week: 3,
            day: 'Mon',
            word: "eraser",
            meaning: "지우개",
            example: "I have an eraser.",
            korEx: "나는 지우개가 있어요."
        },
        {
            id: 16,
            study_date: '2026-03-16',
            week: 3,
            day: 'Mon',
            word: "ruler",
            meaning: "자",
            example: "This is a long ruler.",
            korEx: "이것은 긴 자예요."
        },
        {
            id: 17,
            study_date: '2026-03-18',
            week: 3,
            day: 'Wed',
            word: "pencil-case",
            meaning: "필통",
            example: "Put it in the pencil-case.",
            korEx: "그것을 필통에 넣으세요."
        },
        {
            id: 18,
            study_date: '2026-03-18',
            week: 3,
            day: 'Wed',
            word: "notebook",
            meaning: "공책",
            example: "Write on the notebook.",
            korEx: "공책에 쓰세요."
        },
        {
            id: 19,
            study_date: '2026-03-20',
            week: 3,
            day: 'Fri',
            word: "desk",
            meaning: "책상",
            example: "The book is on the desk.",
            korEx: "책이 책상 위에 있어요."
        },
        {
            id: 20,
            study_date: '2026-03-20',
            week: 3,
            day: 'Fri',
            word: "chair",
            meaning: "의자",
            example: "Sit on the chair.",
            korEx: "의자에 앉으세요."
        },
        {
            id: 21,
            study_date: '2026-03-23',
            week: 4,
            day: 'Mon',
            word: "whiteboard",
            meaning: "화이트보드",
            example: "Look at the whiteboard.",
            korEx: "화이트보드를 보세요."
        },
        {
            id: 22,
            study_date: '2026-03-23',
            week: 4,
            day: 'Mon',
            word: "computer",
            meaning: "컴퓨터",
            example: "Use the computer.",
            korEx: "컴퓨터를 사용하세요."
        },
        {
            id: 23,
            study_date: '2026-03-25',
            week: 4,
            day: 'Wed',
            word: "backpack",
            meaning: "배낭",
            example: "My backpack is heavy.",
            korEx: "내 배낭은 무거워요."
        },
        {
            id: 24,
            study_date: '2026-03-25',
            week: 4,
            day: 'Wed',
            word: "map",
            meaning: "지도",
            example: "Look at the map.",
            korEx: "지도를 보세요."
        },
        {
            id: 28,
            study_date: '2026-03-30',
            week: 4,
            day: 'Mon',
            word: "apple",
            meaning: "사과",
            example: "I like to eat a red apple.",
            korEx: "나는 빨간 사과를 먹는 것을 좋아해요."
        },
        {
            id: 29,
            study_date: '2026-03-30',
            week: 4,
            day: 'Mon',
            word: "orange",
            meaning: "오렌지",
            example: "This is a orange.",
            korEx: "이것은 orange입니다."
        },
        {
            id: 30,
            study_date: '2026-03-30',
            week: 4,
            day: 'Mon',
            word: "banana",
            meaning: "바나나",
            example: "The monkey is eating a banana.",
            korEx: "원숭이가 바나나를 먹고 있어요."
        },
        {
            id: 32,
            study_date: '2026-06-29',
            week: 1,
            day: 'Mon',
            word: "swim tube",
            meaning: "튜브",
            example: "I float on my blue swim tube.",
            korEx: "나는 내 파란색 튜브를 타고 물에 둥둥 떠 있어요."
        },
        {
            id: 41,
            study_date: '2026-06-29',
            week: 1,
            day: 'Mon',
            word: "water gun",
            meaning: "물총",
            example: "We play with a water gun in the yard.",
            korEx: "우리는 마당에서 물총을 가지고 놀아요."
        },
        {
            id: 42,
            study_date: '2026-06-29',
            week: 1,
            day: 'Mon',
            word: "boat",
            meaning: "배",
            example: "The little boat moves on the river.",
            korEx: "작은 배가 강 위로 움직여요."
        },
        {
            id: 34,
            study_date: '2026-07-01',
            week: 1,
            day: 'Wed',
            word: "beach ball",
            meaning: "비치볼",
            example: "Catch this big beach ball!",
            korEx: "이 큰 비치볼을 받아봐!"
        },
        {
            id: 43,
            study_date: '2026-07-01',
            week: 1,
            day: 'Wed',
            word: "life vest",
            meaning: "구명조끼",
            example: "Always wear a life vest in the pool.",
            korEx: "수영장에서는 항상 구명조끼를 입으세요."
        },
        {
            id: 44,
            study_date: '2026-07-01',
            week: 1,
            day: 'Wed',
            word: "sand bucket",
            meaning: "모래 바구니",
            example: "I filled my sand bucket with soft sand.",
            korEx: "나는 모래 바구니에 부드러운 모래를 가득 채웠어요."
        },
        {
            id: 35,
            study_date: '2026-07-02',
            week: 1,
            day: 'Wed',
            word: "testword",
            meaning: "testmeaning",
            example: "No example",
            korEx: "예문 없음"
        },
        {
            id: 36,
            study_date: '2026-07-02',
            week: 1,
            day: 'Wed',
            word: "testword2",
            meaning: "testmeaning2",
            example: "No example",
            korEx: "예문 없음"
        },
        {
            id: 45,
            study_date: '2026-07-03',
            week: 1,
            day: 'Fri',
            word: "glove",
            meaning: "글러브 / 장갑",
            example: "Put on your baseball glove.",
            korEx: "야구 글러브를 끼렴."
        },
        {
            id: 46,
            study_date: '2026-07-03',
            week: 1,
            day: 'Fri',
            word: "bat",
            meaning: "방망이",
            example: "He swings the bat very fast.",
            korEx: "그는 방망이를 아주 빠르게 휘둘러요."
        },
        {
            id: 47,
            study_date: '2026-07-03',
            week: 1,
            day: 'Fri',
            word: "soccer ball",
            meaning: "축구공",
            example: "We kick the soccer ball together.",
            korEx: "우리는 함께 축구공을 차요."
        },
        {
            id: 48,
            study_date: '2026-07-06',
            week: 2,
            day: 'Mon',
            word: "skateboard",
            meaning: "스케이트보드",
            example: "She can ride a skateboard well.",
            korEx: "그녀는 스케이트보드를 잘 탈 수 있어요"
        },
        {
            id: 49,
            study_date: '2026-07-06',
            week: 2,
            day: 'Mon',
            word: "scooter",
            meaning: "씽씽이 / 킥보드",
            example: "I ride my scooter to the park.",
            korEx: "나는 공원까지 킥보드를 타고 가요."
        },
        {
            id: 50,
            study_date: '2026-07-06',
            week: 2,
            day: 'Mon',
            word: "yo-yo",
            meaning: "요요",
            example: "The red yo-yo goes up and down.",
            korEx: "빨간 요요가 위아래로 움직여요."
        },
        {
            id: 51,
            study_date: '2026-07-08',
            week: 2,
            day: 'Wed',
            word: "marker",
            meaning: "사인펜",
            example: "Draw a line with a green marker.",
            korEx: "초록색 사인펜으로 선을 그리세요."
        },
        {
            id: 52,
            study_date: '2026-07-08',
            week: 2,
            day: 'Wed',
            word: "stapler",
            meaning: "호치키스 / 스테이플러",
            example: "May I borrow your stapler?",
            korEx: "네 스테이플러 좀 빌릴 수 있을까?"
        },
        {
            id: 53,
            study_date: '2026-07-10',
            week: 2,
            day: 'Fri',
            word: "paintbrush",
            meaning: "붓 / 미술용 붓",
            example: "Dip the paintbrush in the water.",
            korEx: "미술용 붓을 물에 담그세요."
        },
        {
            id: 54,
            study_date: '2026-07-10',
            week: 2,
            day: 'Fri',
            word: "glue stick",
            meaning: "딱풀",
            example: "Use a glue stick to paste the paper.",
            korEx: "종이를 붙이기 위해 딱풀을 사용하렴."
        },
        {
            id: 55,
            study_date: '2026-07-13',
            week: 3,
            day: 'Mon',
            word: "colored pencil",
            meaning: "색연필",
            example: "Can I use your red colored pencil?",
            korEx: "네 빨간색 색연필을 써도 되니?"
        },
        {
            id: 56,
            study_date: '2026-07-13',
            week: 3,
            day: 'Mon',
            word: "pencil sharpener",
            meaning: "연필깎이",
            example: "Put the dull pencil in the pencil sharpener.",
            korEx: "뭉툭한 연필을 연필깎이에 넣으렴."
        },
        {
            id: 57,
            study_date: '2026-07-15',
            week: 3,
            day: 'Wed',
            word: "pizza",
            meaning: "피자",
            example: "Let's eat a warm pizza tonight.",
            korEx: "오늘 밤에 따뜻한 피자를 먹자."
        },
        {
            id: 58,
            study_date: '2026-07-15',
            week: 3,
            day: 'Wed',
            word: "fish",
            meaning: "생선 / 물고기",
            example: "My mom cooks fish for dinner.",
            korEx: "우리 엄마는 저녁으로 생선을 요리해 주셔요."
        },
        {
            id: 59,
            study_date: '2026-07-20',
            week: 4,
            day: 'Mon',
            word: "chicken",
            meaning: "닭고기",
            example: "I like crispy fried chicken.",
            korEx: "나는 바삭한 프라이드치킨을 좋아해요."
        },
        {
            id: 60,
            study_date: '2026-07-20',
            week: 4,
            day: 'Mon',
            word: "steak",
            meaning: "스테이크",
            example: "The steak is very soft and yummy.",
            korEx: "그 스테이크는 아주 부드럽고 맛있어요."
        },
        {
            id: 61,
            study_date: '2026-07-22',
            week: 4,
            day: 'Wed',
            word: "soup",
            meaning: "수프/ 국",
            example: "This potato soup warms my body.",
            korEx: "이 감자 수프는 내 몸을 따뜻하게 해 주네요."
        },
        {
            id: 62,
            study_date: '2026-07-22',
            week: 4,
            day: 'Wed',
            word: "juice",
            meaning: "주스",
            example: "I want a glass of orange juice.",
            korEx: "나는 오렌지 주스 한 잔을 원해요."
        },
        {
            id: 63,
            study_date: '2026-07-27',
            week: 1,
            day: 'Mon',
            word: "duck",
            meaning: "오리",
            example: "The duck is swimming in the pond.",
            korEx: "오리가 못에서 수영하고 있어요."
        },
        {
            id: 64,
            study_date: '2026-07-27',
            week: 1,
            day: 'Mon',
            word: "horse",
            meaning: "말",
            example: "He rides a brown horse.",
            korEx: "그는 갈색 말을 타요."
        },
        {
            id: 65,
            study_date: '2026-07-27',
            week: 1,
            day: 'Mon',
            word: "turkey",
            meaning: "칠면조",
            example: "Look at the big turkey.",
            korEx: "저 큰 칠면조를 보세요."
        },
        {
            id: 66,
            study_date: '2026-07-29',
            week: 1,
            day: 'Wed',
            word: "cow",
            meaning: "소",
            example: "The cow gives us fresh milk.",
            korEx: "소는 우리에게 신선한 우유를 줘요."
        },
        {
            id: 67,
            study_date: '2026-07-29',
            week: 1,
            day: 'Wed',
            word: "goat",
            meaning: "염소",
            example: "The goat is eating green grass.",
            korEx: "염소가 푸른 풀을 먹고 있어요."
        },
        {
            id: 68,
            study_date: '2026-07-29',
            week: 1,
            day: 'Wed',
            word: "rabbit",
            meaning: "토끼",
            example: "The rabbit hops very fast.",
            korEx: "토끼가 아주 빠르게 깡충깡충 뛰어갑니다."
        },
        {
            id: 69,
            study_date: '2026-07-31',
            week: 1,
            day: 'Fri',
            word: "skunk",
            meaning: "스컹크",
            example: "The skunk has a black and white tail.",
            korEx: "스컹크는 검은색과 흰색 꼬리를 가지고 있어요."
        },
        {
            id: 70,
            study_date: '2026-07-31',
            week: 1,
            day: 'Fri',
            word: "cheetah",
            meaning: "치타",
            example: "A cheetah runs extremely fast.",
            korEx: "치타는 매우 빠르게 달려요."
        },
        {
            id: 71,
            study_date: '2026-07-31',
            week: 1,
            day: 'Fri',
            word: "snake",
            meaning: "뱀",
            example: "The green snake is on the tree.",
            korEx: "초록색 뱀이 나무 위에 있어요."
        },
        {
            id: 72,
            study_date: '2026-08-10',
            week: 2,
            day: 'Mon',
            word: "owl",
            meaning: "부엉이 / 올빼미",
            example: "The owl flies at night.",
            korEx: "부엉이는 밤에 날아다녀요."
        },
        {
            id: 73,
            study_date: '2026-08-10',
            week: 2,
            day: 'Mon',
            word: "peacock",
            meaning: "공작",
            example: "The peacock opens its beautiful feathers.",
            korEx: "공작이 아름다운 깃털을 펴요."
        },
        {
            id: 74,
            study_date: '2026-08-10',
            week: 2,
            day: 'Mon',
            word: "fox",
            meaning: "여우",
            example: "The clever fox is hiding in the bushes.",
            korEx: "똑똑한 여우가 덤불 속에 숨어 있어요."
        },
        {
            id: 75,
            study_date: '2026-08-12',
            week: 2,
            day: 'Wed',
            word: "doctor",
            meaning: "의사",
            example: "The doctor helps sick people.",
            korEx: "의사 선생님은 아픈 사람들을 도와줘요."
        },
        {
            id: 76,
            study_date: '2026-08-12',
            week: 2,
            day: 'Wed',
            word: "cook",
            meaning: "요리사",
            example: "The cook is making delicious pasta.",
            korEx: "요리사가 맛있는 파스타를 만들고 있어요."
        },
        {
            id: 77,
            study_date: '2026-08-14',
            week: 2,
            day: 'Fri',
            word: "teacher",
            meaning: "선생님",
            example: "Our teacher is very kind.",
            korEx: "우리 선생님은 매우 친절해요."
        },
        {
            id: 78,
            study_date: '2026-08-14',
            week: 2,
            day: 'Fri',
            word: "nurse",
            meaning: "간호사",
            example: "The nurse takes care of the patients.",
            korEx: "간호사 선생님이 환자들을 돌봐주세요."
        },
        {
            id: 79,
            study_date: '2026-08-19',
            week: 3,
            day: 'Wed',
            word: "bus-driver",
            meaning: "버스 기사",
            example: "The bus-driver drives safely.",
            korEx: "버스 기사님이 안전하게 운전해요."
        },
        {
            id: 80,
            study_date: '2026-08-19',
            week: 3,
            day: 'Wed',
            word: "student",
            meaning: "학생",
            example: "She is a hard-working student.",
            korEx: "그녀는 열심히 공부하는 학생이에요."
        },
        {
            id: 81,
            study_date: '2026-08-21',
            week: 3,
            day: 'Fri',
            word: "singers",
            meaning: "가수들",
            example: "The singers are on the stage.",
            korEx: "가수들이 무대 위에 있어요."
        },
        {
            id: 82,
            study_date: '2026-08-21',
            week: 3,
            day: 'Fri',
            word: "dancers",
            meaning: "춤추는 사람들 / 댄서들",
            example: "The dancers are moving to the music.",
            korEx: "댄서들이 음악에 맞춰 춤을 추고 있어요."
        },
        {
            id: 83,
            study_date: '2026-08-24',
            week: 4,
            day: 'Mon',
            word: "farmers",
            meaning: "농부들",
            example: "The farmers grow fresh vegetables.",
            korEx: "농부들이 신선한 야채를 재배해요."
        },
        {
            id: 84,
            study_date: '2026-08-24',
            week: 4,
            day: 'Mon',
            word: "vets",
            meaning: "수의사들",
            example: "Vets treat sick animals.",
            korEx: "수의사들은 아픈 동물들을 치료해 줘요."
        },
        {
            id: 85,
            study_date: '2026-08-26',
            week: 4,
            day: 'Wed',
            word: "firefighters",
            meaning: "소방관들",
            example: "Brave firefighters put out fires.",
            korEx: "용감한 소방관들이 불을 끕니다."
        },
        {
            id: 86,
            study_date: '2026-08-26',
            week: 4,
            day: 'Wed',
            word: "police-officers",
            meaning: "경찰관들",
            example: "Police-officers keep our city safe.",
            korEx: "경찰관들이 우리 도시를 안전하게 지켜줘요."
        }
    ];

    let allWords = [];
    try {
        const response = await fetch(`${API_URL}/words`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        const fetchedIds = new Set(data.map(item => item.word?.toLowerCase()));
        const uniqueHardcoded = hardcoded.filter(item => !fetchedIds.has(item.word?.toLowerCase()));
        allWords = [...uniqueHardcoded, ...data];

        console.log('Data synced from DB');
    } catch (err) {
        console.error('Error fetching words, using hardcoded fallback:', err);
        allWords = hardcoded;
    }

    // Filter words belonging to the active cycle
    const cycles = detectCycles(allWords);
    const todayStr = getLocalDateString(new Date());
    const activeCycle = getActiveCycle(cycles, todayStr);
    
    if (activeCycle && activeCycle.length > 0) {
        rawWords = activeCycle;

        // Dynamically calculate and update dateMapping by finding the actual start Monday of each week in the database
        const weeksMonday = { 1: null, 2: null, 3: null, 4: null };

        for (let w = 1; w <= 4; w++) {
            const weekWords = activeCycle.filter(word => Number(word.week) === w);
            if (weekWords.length > 0) {
                let minDateStr = weekWords[0].study_date;
                weekWords.forEach(word => {
                    if (word.study_date < minDateStr) {
                        minDateStr = word.study_date;
                    }
                });
                
                // Parse timezone-agnostically in local time
                const parts = minDateStr.split('-');
                const minDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                const dayOfWeek = minDate.getDay();
                let monDate;
                if (dayOfWeek === 0) { // Sunday
                    monDate = new Date(minDate.getTime() - 6 * 24 * 60 * 60 * 1000);
                } else {
                    monDate = new Date(minDate.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000);
                }
                weeksMonday[w] = monDate;
            }
        }

        // Propagate Monday dates forward if a week has no words registered
        if (!weeksMonday[1]) {
            const firstDateStr = activeCycle[0].study_date;
            const parts = firstDateStr.split('-');
            const firstDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            const dayOfWeek = firstDate.getDay();
            let monDate;
            if (dayOfWeek === 0) {
                monDate = new Date(firstDate.getTime() - 6 * 24 * 60 * 60 * 1000);
            } else {
                monDate = new Date(firstDate.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000);
            }
            weeksMonday[1] = monDate;
        }

        for (let w = 2; w <= 4; w++) {
            if (!weeksMonday[w]) {
                weeksMonday[w] = new Date(weeksMonday[w - 1].getTime() + 7 * 24 * 60 * 60 * 1000);
            }
        }

        const mapping = {
            1: { Mon: null, Wed: null, Fri: null },
            2: { Mon: null, Wed: null, Fri: null },
            3: { Mon: null, Wed: null, Fri: null },
            4: { Mon: null, Wed: null, Fri: null }
        };

        for (let w = 1; w <= 4; w++) {
            const monDate = weeksMonday[w];
            const wedDate = new Date(monDate.getTime() + 2 * 24 * 60 * 60 * 1000);
            const friDate = new Date(monDate.getTime() + 4 * 24 * 60 * 60 * 1000);

            mapping[w].Mon = {
                label: `${monDate.getMonth() + 1}/${monDate.getDate()}`,
                dateStr: getLocalDateString(monDate)
            };
            mapping[w].Wed = {
                label: `${wedDate.getMonth() + 1}/${wedDate.getDate()}`,
                dateStr: getLocalDateString(wedDate)
            };
            mapping[w].Fri = {
                label: `${friDate.getMonth() + 1}/${friDate.getDate()}`,
                dateStr: getLocalDateString(friDate)
            };
        }

        activeCycle.forEach(word => {
            if (mapping[word.week] && mapping[word.week][word.day]) {
                const parts = word.study_date.split('-');
                const itemDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                mapping[word.week][word.day] = {
                    label: `${itemDate.getMonth() + 1}/${itemDate.getDate()}`,
                    dateStr: word.study_date
                };
            }
        });

        dateMapping = mapping;
    } else {
        rawWords = allWords;
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
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        usVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Natural')) ||
            voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
            voices.find(v => v.lang === 'en-US') ||
            voices[0];
    }
}
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = initVoices;
    initVoices();
}

function speak(text, isExciting = false) {
    if (!window.speechSynthesis) return;
    
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';

    if (!usVoice) {
        initVoices();
    }
    if (usVoice) {
        try {
            utterance.voice = usVoice;
        } catch (e) {
            console.warn('Failed to set custom voice:', e);
        }
    }

    if (isExciting) {
        utterance.pitch = 1.3;
        utterance.rate = 1.0;
    } else {
        utterance.pitch = 1.0;
        utterance.rate = 0.85;
    }
    
    window.speechSynthesis.speak(utterance);
}

function getWeekAndDayFromDate(dateStr) {
    if (!dateStr) return { week: 1, day: 'Mon' };
    const cleanDateStr = dateStr.split('T')[0].split(' ')[0];

    // 1. Search dateMapping
    for (let w = 1; w <= 4; w++) {
        for (const d of ['Mon', 'Wed', 'Fri']) {
            if (dateMapping[w] && dateMapping[w][d] && dateMapping[w][d].dateStr === cleanDateStr) {
                return { week: w, day: d };
            }
        }
    }

    // 2. Fall back to activeCycle's relative calculation
    const parts = cleanDateStr.split('-');
    if (parts.length < 3) return { week: 1, day: 'Mon' };
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (isNaN(dateObj.getTime())) return { week: 1, day: 'Mon' };

    let startMonday = null;
    const allStoredWords = rawWords.filter(w => w.study_date);
    if (allStoredWords.length > 0) {
        const cycleStartDate = new Date(allStoredWords[0].study_date);
        const dayOfWeek = cycleStartDate.getDay();
        if (dayOfWeek === 0) {
            startMonday = new Date(cycleStartDate.getTime() - 6 * 24 * 60 * 60 * 1000);
        } else {
            startMonday = new Date(cycleStartDate.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000);
        }
    }

    if (startMonday) {
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

    // 3. Fallback to generic month first-Monday logic if no rawWords exist
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

    const nextMonthDate = new Date(year, month + 1, 1);
    const nextStartMonday = getStartMonday(nextMonthDate.getFullYear(), nextMonthDate.getMonth());

    let finalStartMonday;
    if (dateObj >= nextStartMonday) {
        finalStartMonday = nextStartMonday;
    } else {
        const currStartMonday = getStartMonday(year, month);
        if (dateObj < currStartMonday) {
            const prevMonthDate = new Date(year, month - 1, 1);
            finalStartMonday = getStartMonday(prevMonthDate.getFullYear(), prevMonthDate.getMonth());
        } else {
            finalStartMonday = currStartMonday;
        }
    }

    const diffTime = dateObj.getTime() - finalStartMonday.getTime();
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

    // 초기 데이터 로딩 후 앱 시작
    fetchAllWords().then(() => {
        // 오늘 날짜에 맞는 주차와 요일 자동 계산 및 탭 적용
        const today = new Date();
        const todayStr = getLocalDateString(today);
        const initDate = getWeekAndDayFromDate(todayStr);
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
