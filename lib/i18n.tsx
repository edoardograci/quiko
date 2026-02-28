'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Lang = 'ko' | 'en';

// All UI strings in both languages
export const strings = {
    nav: {
        home: { ko: '홈', en: 'Home' },
        review: { ko: '복습', en: 'Review' },
        vocabulary: { ko: '단어장', en: 'Vocabulary' },
        sentences: { ko: '문장', en: 'Sentences' },
        grammar: { ko: '문법', en: 'Grammar' },
        dictionary: { ko: '사전', en: 'Dictionary' },
        settings: { ko: '설정', en: 'Settings' },
    },
    dashboard: {
        title: { ko: '오늘의 학습', en: "Today's Study" },
        dailyReview: { ko: '오늘의 복습', en: 'Daily Review' },
        startReview: { ko: '복습 시작', en: 'Start Review' },
        dueCards: { ko: '카드', en: 'cards' },
        reviewCount: { ko: '복습', en: 'review' },
        newCount: { ko: '신규', en: 'new' },
        heatmap: { ko: '복습 기록', en: 'Review History' },
        upcoming: { ko: '향후 7일 복습', en: 'Next 7 Days' },
        recentAdded: { ko: '최근 추가', en: 'Recently Added' },
        viewAll: { ko: '전체 보기', en: 'View all' },
        noWords: { ko: '아직 단어가 없어요', en: 'No words yet' },
        welcomeTitle: { ko: 'Quiko에 오신 것을 환영합니다!', en: 'Welcome to Quiko!' },
        welcomeBody: { ko: '첫 단어나 Grammar pattern을 추가하면 FSRS-5 복습 일정이 자동으로 생성됩니다.', en: 'Add your first word or grammar pattern to start the FSRS-5 review schedule.' },
        addWord: { ko: '단어 추가', en: 'Add Word' },
        viewGrammar: { ko: '문법 보기', en: 'View Grammar' },
        addSentence: { ko: '문장 추가', en: 'Add Sentence' },
        wordsLabel: { ko: '단어', en: 'Words' },
        sentencesLabel: { ko: '문장', en: 'Sentences' },
        grammarLabel: { ko: '문법', en: 'Grammar' },
        accuracyLabel: { ko: '정확도', en: 'Accuracy' },
        todayLabel: { ko: '오늘', en: 'today' },
        tomorrowLabel: { ko: '내일', en: 'tomorrow' },
        emptyToday: { ko: '오늘', en: 'today' },
    },
    review: {
        title: { ko: '복습 세션', en: 'Review Session' },
        standard: { ko: '표준 복습', en: 'Standard Review' },
        wordOnly: { ko: '단어 복습', en: 'Vocabulary Only' },
        grammarOnly: { ko: '문법 복습', en: 'Grammar Only' },
        noDue: { ko: '오늘 복습할 카드가 없어요', en: 'No cards due today' },
        showAnswer: { ko: '정답 확인', en: 'Show Answer' },
        done: { ko: '복습 완료!', en: 'Session Complete!' },
        totalCards: { ko: '카드 검토', en: 'Cards Reviewed' },
        accuracy: { ko: '정확도', en: 'Accuracy' },
        perCard: { ko: '카드당 평균', en: 'Avg per Card' },
        tomorrow: { ko: '내일 예정', en: 'Due Tomorrow' },
        ratingAgain: { ko: '다시', en: 'Again' },
        ratingHard: { ko: '어려워', en: 'Hard' },
        ratingGood: { ko: '잘 알아', en: 'Good' },
        ratingEasy: { ko: '쉬워', en: 'Easy' },
        backToMenu: { ko: '복습 메뉴로', en: 'Back to Menu' },
        endSession: { ko: '종료', en: 'End' },
        goHome: { ko: '홈으로', en: 'Home' },
        newSession: { ko: '새 세션', en: 'New Session' },
        ratingHistory: { ko: '평가 내역', en: 'Rating History' },
        recognition: { ko: '인식', en: 'Recognition' },
        production: { ko: '생성', en: 'Production' },
    },
    vocabulary: {
        title: { ko: '단어장', en: 'Vocabulary' },
        addWord: { ko: '단어 추가', en: 'Add Word' },
        searchPlaceholder: { ko: '한국어로 검색... (자모 검색 지원)', en: 'Search words...' },
        posFilter: { ko: '전체 품사', en: 'All POS' },
        levelFilter: { ko: '전체 레벨', en: 'All Levels' },
        noWords: { ko: '아직 단어가 없어요', en: 'No words yet' },
        noWordsBody: { ko: '단어를 추가하여 복습을 시작하세요.', en: 'Add words to start reviewing.' },
        firstWord: { ko: '첫 단어 추가하기', en: 'Add First Word' },
        sortRecent: { ko: '최근 추가순', en: 'Recently Added' },
        sortAlpha: { ko: '가나다순', en: 'Alphabetical' },
        sortFreq: { ko: '빈도순', en: 'By Frequency' },
    },
    sentences: {
        title: { ko: '문장 라이브러리', en: 'Sentence Library' },
        addBtn: { ko: '문장 추가', en: 'Add Sentence' },
        noItems: { ko: '아직 문장이 없어요', en: 'No sentences yet' },
        noBody: { ko: '문장을 추가하여 학습을 시작하세요.', en: 'Add sentences to start studying.' },
        firstItem: { ko: '첫 문장 추가하기', en: 'Add First Sentence' },
    },
    grammar: {
        title: { ko: '문법', en: 'Grammar' },
        addBtn: { ko: '패턴 추가', en: 'Add Pattern' },
        noItems: { ko: '문법 패턴이 없어요', en: 'No grammar patterns' },
        noBody: { ko: '설정에서 데이터베이스를 초기화하면 기본 문법 패턴이 로드됩니다.', en: 'Go to Settings → Seed Database to load built-in grammar patterns.' },
        addFirst: { ko: '패턴 추가하기', en: 'Add Pattern' },
        sentenceCount: { ko: '문장', en: 'sentences' },
        linkedSentences: { ko: '이 패턴이 사용된 문장', en: 'Sentences using this pattern' },
        addSentence: { ko: '문장 추가', en: 'Add Sentence' },
        noLinked: { ko: '아직 연결된 문장이 없어요', en: 'No linked sentences yet' },
    },
    dictionary: {
        title: { ko: '한국어 사전', en: 'Korean Dictionary' },
        searchPlaceholder: { ko: '한국어로 검색...', en: 'Search in Korean...' },
        searchPrompt: { ko: '한국어 단어를 검색하세요', en: 'Search for a Korean word' },
        searchSubtext: { ko: 'KRDICT에서 뜻, 발음, 예문을 가져옵니다', en: 'Fetches definitions, pronunciation, and examples from KRDICT' },
        noResults: { ko: '검색 결과가 없어요', en: 'No results found' },
        addToVocab: { ko: '단어장 추가', en: 'Add to Vocabulary' },
        apiNotSet: { ko: 'KRDICT API 키가 설정되지 않았거나 결과가 없습니다.', en: 'KRDICT API key not set or no results found.' },
    },
    settings: {
        title: { ko: '설정', en: 'Settings' },
        reviewSettings: { ko: '복습 설정', en: 'Review Settings' },
        dailyLimit: { ko: '하루 복습 한도', en: 'Daily Review Limit' },
        newCards: { ko: '하루 신규 카드', en: 'New Cards Per Day' },
        retention: { ko: '목표 기억률 (FSRS)', en: 'Target Retention (FSRS)' },
        retentionNote: { ko: '높을수록 더 자주 복습합니다. 권장값: 90%', en: 'Higher = more frequent reviews. Recommended: 90%' },
        displaySettings: { ko: '표시 설정', en: 'Display Settings' },
        theme: { ko: '테마', en: 'Theme' },
        showPronounciation: { ko: '발음 표시', en: 'Show Pronunciation' },
        showPronunciationDesc: { ko: '단어 발음 가이드', en: 'Pronunciation guide on word cards' },
        keyboardSettings: { ko: '입력 설정', en: 'Input Settings' },
        onscreenKeyboard: { ko: '화면 키보드', en: 'On-Screen Keyboard' },
        onscreenKeyboardDesc: { ko: '두벌식 한글 키보드', en: 'Dubeolsik Hangul keyboard' },
        dataManagement: { ko: '데이터 관리', en: 'Data Management' },
        seedDb: { ko: '데이터베이스 시드 (문법 패턴 로드)', en: 'Seed Database (Load Grammar Patterns)' },
        exportData: { ko: '데이터 내보내기 (JSON)', en: 'Export Data (JSON)' },
        saved: { ko: '설정이 저장되었습니다', en: 'Settings saved' },
        saveFail: { ko: '저장 실패', en: 'Failed to save' },
    },
    common: {
        cancel: { ko: '취소', en: 'Cancel' },
        save: { ko: '저장', en: 'Save' },
        add: { ko: '추가', en: 'Add' },
        delete: { ko: '삭제', en: 'Delete' },
        edit: { ko: '편집', en: 'Edit' },
        back: { ko: '뒤로', en: 'Back' },
        search: { ko: '검색', en: 'Search' },
        loading: { ko: '로딩 중...', en: 'Loading...' },
        notes: { ko: '메모', en: 'Notes' },
        level: { ko: '레벨', en: 'Level' },
        source: { ko: '출처', en: 'Source' },
        example: { ko: '예문', en: 'Example' },
        definition: { ko: '뜻', en: 'Definition' },
        count: { ko: '개', en: '' },
    },
};

export type Strings = typeof strings;

// Helper: get a string in the given language
export function t(key: { ko: string; en: string }, lang: Lang): string {
    return key[lang];
}

// Context
interface LangContextValue {
    lang: Lang;
    setLang: (l: Lang) => void;
    t: (key: { ko: string; en: string }) => string;
}

const LangContext = createContext<LangContextValue>({
    lang: 'ko',
    setLang: () => { },
    t: (key) => key.ko,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Lang>('ko');

    useEffect(() => {
        const saved = localStorage.getItem('quiko-lang') as Lang | null;
        if (saved === 'ko' || saved === 'en') setLangState(saved);
    }, []);

    const setLang = (l: Lang) => {
        setLangState(l);
        localStorage.setItem('quiko-lang', l);
    };

    const tFn = (key: { ko: string; en: string }) => key[lang];

    return (
        <LangContext.Provider value={{ lang, setLang, t: tFn }}>
            {children}
        </LangContext.Provider>
    );
}

export function useLang() {
    return useContext(LangContext);
}
