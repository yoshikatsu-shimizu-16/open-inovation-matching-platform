const screens = Array.from(document.querySelectorAll('[data-screen]'));
const flowSteps = Array.from(document.querySelectorAll('[data-step]'));
const flowStatus = document.getElementById('flowStatus');
const toast = document.getElementById('toast');

const categoryDefinitions = [
  {
    key: 'purpose',
    name: '目的・背景・困りごと',
    items: [
      { label: '目的', question: '今回の相談で、最終的に何を整理できると前進できそうですか？', reason: '目的を確認し、候補探し自体が目的にならないようにします。', sample: '新しいサービスの実現に必要な能力と、どんな相手と組むべきかを整理したいです。' },
      { label: '背景', question: 'この課題が生まれた背景や、現在までに試したことはありますか？', reason: '既に試したことと、まだ検証していないことを分けるためです。', sample: '社内でアイデア出しはしましたが、技術的な実現方法までは検証できていません。' },
      { label: '困りごと', question: '今いちばん困っていることを、できるだけ具体的に教えてください。', reason: '相談者自身の言葉を課題整理の事実起点にします。', sample: '構想はあるものの、自社だけではプロトタイプを作れる人材が足りません。' }
    ]
  },
  {
    key: 'resources',
    name: '保有能力・提供資源',
    items: [
      { label: '保有能力', question: '自組織がすでに持っている知識・技術・経験は何ですか？', reason: '不足能力だけでなく、相手に提供できる強みも確認します。', sample: '対象業界の現場知識と顧客課題のヒアリング経験があります。' },
      { label: '提供資源', question: '共創相手に提供できるデータ、設備、人材、顧客接点などはありますか？', reason: '一方的に支援を受ける関係ではなく、補完関係を検討するためです。', sample: '検証に協力できる担当者と、既存顧客へのヒアリング機会を提供できます。' }
    ]
  },
  {
    key: 'gap',
    name: '不足能力・ギャップ',
    items: [
      { label: '不足能力', question: '自組織だけでは不足している能力や専門性は何だと感じていますか？', reason: '候補評価で補完性を見るための中心情報になります。', sample: 'Webアプリの試作と、AI活用の技術検証を行える実装能力が不足しています。' },
      { label: 'ギャップ', question: '現在の状態と、実現したい状態の間にどんな差がありますか？', reason: '「何が足りないか」を成果との関係で整理します。', sample: 'アイデア段階から、実際に利用者が触って評価できる検証段階へ進めていません。' }
    ]
  },
  {
    key: 'partner',
    name: '相手種別・連携形態',
    items: [
      { label: '相手種別', question: 'どんな種類の相手と組むイメージがありますか？', reason: '企業、大学、専門家など、想定する相手の範囲を確認します。', sample: '小回りの利く技術企業や、プロトタイプ開発に強い専門家を想定しています。' },
      { label: '相手への期待', question: '相手に期待する役割は何ですか？', reason: '「有名な会社」ではなく、必要な役割で候補を検討できるようにします。', sample: '技術選定とプロトタイプ実装を一緒に進め、実現可能性を検証してほしいです。' },
      { label: '連携形態', question: 'まずはどの程度の関わり方から始めたいですか？', reason: '共同研究、PoC、業務委託など、連携方法の仮説を整理します。', sample: 'まずは小規模なPoCから始めたいですが、契約形態はまだ決めていません。' }
    ]
  },
  {
    key: 'constraints',
    name: '条件・制約',
    items: [
      { label: '必須条件', question: '相手選びで外せない条件はありますか？', reason: '候補評価で明示的に確認すべき制約を整理します。', sample: '初期検証を短期間で一緒に進められることを重視します。' },
      { label: '制約', question: '予算、地域、時期、情報公開などの制約はありますか？', reason: '実現可能性を検討する際に必要な条件です。', sample: '未公開情報は詳細を共有できず、まずは抽象化した情報で検討したいです。' },
      { label: '未確認事項', question: 'まだ決められていないこと、社内確認が必要なことはありますか？', reason: '分からない内容をAIが補完せず、未確認として明示するためです。', sample: '正式な予算と開始時期は社内確認が必要で、まだ確定していません。' }
    ]
  }
];

const questions = categoryDefinitions.flatMap((category) =>
  category.items.map((item, index) => ({
    ...item,
    categoryKey: category.key,
    categoryName: category.name,
    categoryItemIndex: index
  }))
);

const state = {
  screen: 'start',
  questionIndex: 0,
  answers: questions.map(() => ({ status: 'pending', value: '' })),
  initialConsultation: ''
};

function setScreen(name) {
  state.screen = name;
  screens.forEach((screen) => {
    screen.classList.toggle('is-visible', screen.dataset.screen === name);
  });

  const order = ['start', 'interview', 'hypothesis', 'profile', 'confirmed'];
  const activeIndex = order.indexOf(name);
  flowSteps.forEach((step, index) => {
    step.classList.toggle('is-active', index === activeIndex);
    step.classList.toggle('is-complete', index < activeIndex);
  });

  const labels = {
    start: '相談開始',
    interview: '聞き取り中',
    hypothesis: '仮説確認',
    profile: '下書き確認',
    confirmed: '確定済み'
  };
  flowStatus.textContent = labels[name] || '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function answeredCount() {
  return state.answers.filter((answer) => answer.status !== 'pending').length;
}

function renderCategoryProgress() {
  const container = document.getElementById('categoryProgress');
  container.innerHTML = '';
  let globalIndex = 0;

  categoryDefinitions.forEach((category) => {
    const row = document.createElement('div');
    row.className = 'category-row';

    const top = document.createElement('div');
    top.className = 'category-row__top';

    const name = document.createElement('span');
    name.textContent = category.name;

    const categoryAnswers = state.answers.slice(globalIndex, globalIndex + category.items.length);
    const done = categoryAnswers.filter((answer) => answer.status !== 'pending').length;
    const count = document.createElement('span');
    count.textContent = `${done}/${category.items.length}`;

    top.append(name, count);

    const dots = document.createElement('div');
    dots.className = 'item-dots';
    categoryAnswers.forEach((answer, localIndex) => {
      const dot = document.createElement('span');
      dot.className = 'item-dot';
      dot.title = category.items[localIndex].label;
      if (answer.status === 'confirmed') dot.classList.add('is-confirmed');
      if (answer.status === 'unknown') dot.classList.add('is-unknown');
      dots.append(dot);
    });

    row.append(top, dots);
    container.append(row);
    globalIndex += category.items.length;
  });

  document.getElementById('progressCount').textContent = `${answeredCount()} / ${questions.length}`;
}

function renderQuestion() {
  const question = questions[state.questionIndex];
  if (!question) {
    prepareHypothesisScreen();
    setScreen('hypothesis');
    return;
  }

  document.getElementById('currentQuestion').textContent = question.question;
  document.getElementById('questionReason').textContent = `確認理由：${question.reason}`;
  document.getElementById('currentCategory').textContent = question.categoryName;
  document.getElementById('interviewAnswer').value = '';
  renderCategoryProgress();
}

function moveToNextQuestion(status, value) {
  state.answers[state.questionIndex] = { status, value };
  state.questionIndex += 1;
  if (state.questionIndex >= questions.length) {
    renderCategoryProgress();
    prepareHypothesisScreen();
    setScreen('hypothesis');
    return;
  }
  renderQuestion();
}

function prepareHypothesisScreen() {
  const factList = document.getElementById('factList');
  factList.innerHTML = '';

  const initialItem = document.createElement('li');
  initialItem.textContent = `相談開始時の説明：「${state.initialConsultation || '（入力なし）'}」`;
  factList.append(initialItem);

  state.answers.forEach((answer, index) => {
    if (answer.status !== 'confirmed') return;
    const item = document.createElement('li');
    item.textContent = `${questions[index].label}：${answer.value}`;
    factList.append(item);
  });

  const unknownLabels = state.answers
    .map((answer, index) => answer.status === 'unknown' ? questions[index].label : null)
    .filter(Boolean);

  document.getElementById('unknownSummary').textContent = unknownLabels.length > 0
    ? `${unknownLabels.join('、')} は相談者が回答できず、未確認として扱っています。`
    : '今回のサンプル操作では未確認にした項目はありません。';

  document.getElementById('profileUnknowns').value = unknownLabels.length > 0
    ? `${unknownLabels.join('、')} は未確認。正式な予算、実施時期、契約条件なども次工程で確認が必要。`
    : '正式な予算、実施時期、契約条件などは未確認。';
}

function restart() {
  state.screen = 'start';
  state.questionIndex = 0;
  state.answers = questions.map(() => ({ status: 'pending', value: '' }));
  state.initialConsultation = '';
  document.getElementById('initialConsultation').value = '';
  document.getElementById('interviewAnswer').value = '';
  closeModal();
  renderCategoryProgress();
  setScreen('start');
}

function openModal() {
  document.getElementById('confirmModal').hidden = false;
}

function closeModal() {
  document.getElementById('confirmModal').hidden = true;
}

document.getElementById('insertSampleButton').addEventListener('click', () => {
  document.getElementById('initialConsultation').value = '地域企業と新しいサービスを作りたいのですが、自社に足りない技術や、どんな相手と組むべきかをうまく整理できていません。';
});

document.getElementById('startConsultationButton').addEventListener('click', () => {
  const value = document.getElementById('initialConsultation').value.trim();
  if (!value) {
    showToast('相談内容を入力するか、サンプル相談を入れてください。');
    return;
  }
  state.initialConsultation = value;
  state.questionIndex = 0;
  renderQuestion();
  setScreen('interview');
});

document.getElementById('fillAnswerButton').addEventListener('click', () => {
  const question = questions[state.questionIndex];
  if (question) document.getElementById('interviewAnswer').value = question.sample;
});

document.getElementById('submitAnswerButton').addEventListener('click', () => {
  const value = document.getElementById('interviewAnswer').value.trim();
  if (!value) {
    showToast('回答を入力するか、「未確認にする」を選んでください。');
    return;
  }
  moveToNextQuestion('confirmed', value);
});

document.getElementById('skipQuestionButton').addEventListener('click', () => {
  moveToNextQuestion('unknown', '');
});

document.querySelectorAll('[data-back-to]').forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.backTo;
    if (target === 'interview') {
      state.questionIndex = Math.max(0, questions.length - 1);
      renderQuestion();
    }
    setScreen(target);
  });
});

document.getElementById('acceptHypothesisButton').addEventListener('click', () => {
  setScreen('profile');
});

document.getElementById('openConfirmButton').addEventListener('click', openModal);

document.querySelectorAll('[data-close-modal]').forEach((button) => {
  button.addEventListener('click', closeModal);
});

document.getElementById('confirmProfileButton').addEventListener('click', () => {
  closeModal();
  setScreen('confirmed');
});

document.getElementById('candidateFlowButton').addEventListener('click', () => {
  showToast('段階2は今回のモック対象外です。次の独立した縦切りとして扱います。');
});

document.getElementById('restartButton').addEventListener('click', restart);

renderCategoryProgress();
setScreen('start');
