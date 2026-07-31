(function () {

    const GEN_LABEL = {
        'generation-i': '1ª Geração', 'generation-ii': '2ª Geração', 'generation-iii': '3ª Geração',
        'generation-iv': '4ª Geração', 'generation-v': '5ª Geração', 'generation-vi': '6ª Geração',
        'generation-vii': '7ª Geração', 'generation-viii': '8ª Geração', 'generation-ix': '9ª Geração'
    };

    const COLOR_LABEL = {
        black: 'Preto', blue: 'Azul', brown: 'Marrom', gray: 'Cinza', green: 'Verde',
        pink: 'Rosa', purple: 'Roxo', red: 'Vermelho', white: 'Branco', yellow: 'Amarelo'
    };

    const TYPE_LABEL = {
        normal: 'Normal', fire: 'Fogo', water: 'Água', electric: 'Elétrico', grass: 'Grama',
        ice: 'Gelo', fighting: 'Lutador', poison: 'Venenoso', ground: 'Terra', flying: 'Voador',
        psychic: 'Psíquico', bug: 'Inseto', rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão',
        dark: 'Sombrio', steel: 'Aço', fairy: 'Fada'
    };

    const TYPE_COLOR = {
        normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#e8b800', grass: '#5aa93f',
        ice: '#68c9c9', fighting: '#C03028', poison: '#A040A0', ground: '#c9a441', flying: '#8f7de0',
        psychic: '#F85888', bug: '#9aa919', rock: '#B8A038', ghost: '#705898', dragon: '#7038F8',
        dark: '#5c4a3d', steel: '#8f8fae', fairy: '#e388a3'
    };

    const MAX_DEX_ID = 1025;
    const els = {
        dateLabel: document.getElementById('date-label'),
        dexNum: document.getElementById('dex-num'),
        holder: document.getElementById('silhouette-holder'),
        screen: document.getElementById('screen'),
        hintRow: document.getElementById('hint-row'),
        input: document.getElementById('guess-input'),
        guessBtn: document.getElementById('guess-btn'),
        desBtn: document.querySelector('.des-btn'),
        triesLabel: document.getElementById('tries-label'),
        chipsWrap: document.getElementById('chips-wrap'),
        statStreak: document.getElementById('stat-streak'),
        statBest: document.getElementById('stat-best'),
        statTotal: document.getElementById('stat-total'),
        datalist: document.getElementById('pokemon-list') // Seleção do datalist
    };

    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function todayKey() {
        const d = new Date();
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }
    function dateLabelText() {
        const d = new Date();
        const dias = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        return dias[d.getDay()] + ', ' + d.getDate() + ' de ' + meses[d.getMonth()];
    }

    function hashDate(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = (h * 31 + str.charCodeAt(i)) >>> 0;
        }
        return h;
    }

    function dailyId(dateStr) {
        const h = hashDate('pokemon-' + dateStr);
        return (h % MAX_DEX_ID) + 1;
    }

    function normalize(str) {
        return str
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
    }

    async function safeStorageGet(key) {
        try {
            const r = localStorage.getItem(key);
            return r ? JSON.parse(r) : null;
        } catch (e) { return null; }
    }
    async function safeStorageSet(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { }
    }

    // ---------------- State ----------------
    let state = {
        id: null,
        dateStr: null,
        nameEn: '',
        namePt: '',
        displayName: '',
        color: '',
        generation: '',
        types: [],
        imgUrl: '',
        solved: false,
        giveUp: false,
        tries: [],
        hintsRevealed: []
    };

    let streakData = { current: 0, best: 0, total: 0, lastSolvedDate: null };

    function renderStats() {
        if (els.statStreak) els.statStreak.textContent = streakData.current;
        if (els.statBest) els.statBest.textContent = streakData.best;
        if (els.statTotal) els.statTotal.textContent = streakData.total;
    }

    function renderTries() {
        if (els.triesLabel) els.triesLabel.textContent = 'Tentativas: ' + state.tries.length + ' · Chances ilimitadas';
        if (els.chipsWrap) {
            els.chipsWrap.innerHTML = '';
            state.tries.forEach(t => {
                const c = document.createElement('span');
                c.className = 'wrong-chip';
                c.textContent = t;
                els.chipsWrap.appendChild(c);
            });
        }
    }

    function hintValueFor(kind) {
        if (kind === 'color') return COLOR_LABEL[state.color] || state.color;
        if (kind === 'generation') return GEN_LABEL[state.generation] || state.generation;
        if (kind === 'type') return state.types.map(t => TYPE_LABEL[t] || t).join(' / ');
        return '';
    }

    function applyHintButtonState() {
        if (!els.hintRow) return;
        const buttons = els.hintRow.querySelectorAll('.hint-btn');
        buttons.forEach(btn => {
            const kind = btn.getAttribute('data-hint');
            if (state.hintsRevealed.includes(kind)) {
                btn.classList.add('revealed');
                btn.disabled = true;
                btn.querySelector('.hint-label').textContent = kind === 'color' ? 'Cor' : (kind === 'generation' ? 'Geração' : 'Tipo');
                if (kind === 'type') {
                    btn.querySelector('.hint-value').innerHTML = state.types.map(t => {
                        const label = TYPE_LABEL[t] || t;
                        const bg = TYPE_COLOR[t] || '#888';
                        return '<span class="type-chip" style="background:' + bg + '">' + label + '</span>';
                    }).join('');
                } else {
                    btn.querySelector('.hint-value').textContent = hintValueFor(kind);
                }
            } else if (state.hintsRevealed.length >= 2 || state.solved || state.giveUp) {
                btn.disabled = true;
            } else {
                btn.disabled = false;
            }
        });
    }

    function revealHint(kind) {
        if (state.hintsRevealed.includes(kind)) return;
        if (state.hintsRevealed.length >= 2) return;
        state.hintsRevealed.push(kind);
        applyHintButtonState();
        persistDay();
    }

    function persistDay() {
        safeStorageSet('day:' + state.dateStr, {
            id: state.id,
            solved: state.solved,
            giveUp: state.giveUp,
            tries: state.tries,
            hintsRevealed: state.hintsRevealed
        });
    }

    async function persistStreakAfterSolve() {
        const today = state.dateStr;
        const y = new Date();
        y.setDate(y.getDate() - 1);
        const yesterday = y.getFullYear() + '-' + pad(y.getMonth() + 1) + '-' + pad(y.getDate());

        if (streakData.lastSolvedDate === today) {
            // already counted
        } else if (streakData.lastSolvedDate === yesterday) {
            streakData.current += 1;
        } else {
            streakData.current = 1;
        }
        streakData.best = Math.max(streakData.best, streakData.current);
        streakData.total += 1;
        streakData.lastSolvedDate = today;
        await safeStorageSet('streak', streakData);
        renderStats();
    }

    function markSolvedUI(isDesist = false) {
        const img = document.getElementById('poke-img');
        if (img) {
            img.classList.remove('hidden-img');
            img.classList.add('revealed');
        }
        const sweep = document.getElementById('sweep-el');
        if (sweep) {
            sweep.classList.add('play');
        }
        if (els.input) {
            els.input.disabled = true;
            els.input.placeholder = isDesist ? 'Pokémon revelado!' : 'Já capturado hoje!';
        }
        if (els.guessBtn) els.guessBtn.disabled = true;
        if (els.desBtn) els.desBtn.disabled = true;

        if (els.hintRow) {
            const buttons = els.hintRow.querySelectorAll('.hint-btn');
            buttons.forEach(btn => btn.disabled = true);
        }

        let nameBlock = document.getElementById('caught-block');
        if (!nameBlock && els.holder && els.holder.parentElement) {
            nameBlock = document.createElement('div');
            nameBlock.id = 'caught-block';
            els.holder.parentElement.appendChild(nameBlock);
        }
        if (nameBlock) {
            if (isDesist) {
                nameBlock.innerHTML =
                    '<div class="caught-name" style="color: #e74c3c;">É O ' + state.displayName.toUpperCase() + '!</div>' +
                    '<div class="caught-sub">Você desistiu de adivinhar hoje.</div>';
            } else {
                nameBlock.innerHTML =
                    '<div class="caught-name">' + state.displayName.toUpperCase() + '!</div>' +
                    '<div class="caught-sub">Capturado em ' + state.tries.length + (state.tries.length === 1 ? ' tentativa' : ' tentativas') + '</div>';
            }
        }
    }

    function handleGuess() {
        if (!els.input) return;
        const raw = els.input.value.trim();
        if (!raw || state.solved || state.giveUp) return;
        const guess = normalize(raw);
        const correct = guess === normalize(state.nameEn) || guess === normalize(state.namePt);

        if (correct) {
            state.solved = true;
            persistDay();
            persistStreakAfterSolve();
            markSolvedUI(false);
            els.input.value = '';
        } else {
            if (!state.tries.map(normalize).includes(guess)) {
                state.tries.push(raw);
                renderTries();
                persistDay();
            }
            els.input.value = '';
            if (els.screen) {
                els.screen.classList.remove('shake');
                void els.screen.offsetWidth;
                els.screen.classList.add('shake');
            }
        }
    }

    function handleDesist() {
        if (state.solved || state.giveUp) return;
        const confirmResult = confirm("Ei, treinador, tem certeza de sua escolha?");
        if (confirmResult) {
            state.giveUp = true;
            persistDay();
            markSolvedUI(true);
        }
    }

    if (els.guessBtn) els.guessBtn.addEventListener('click', handleGuess);
    if (els.desBtn) els.desBtn.addEventListener('click', handleDesist);

    if (els.input) {
        els.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleGuess();
        });
    }

    if (els.hintRow) {
        els.hintRow.addEventListener('click', (e) => {
            const btn = e.target.closest('.hint-btn');
            if (!btn || btn.disabled) return;
            revealHint(btn.getAttribute('data-hint'));
        });
    }

    function showError(msg) {
        if (els.holder) {
            els.holder.innerHTML = '<div class="error-txt">' + msg + '<br><br><button id="retry-btn" class="hint-btn" style="display:inline-block; padding:8px 16px;">Tentar de novo</button></div>';
            const b = document.getElementById('retry-btn');
            if (b) b.addEventListener('click', init);
        }
    }

    // Carrega a lista completa de nomes para o Autocomplete (datalist)
    async function loadPokemonSuggestions() {
        if (!els.datalist) return;
        try {
            const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=' + MAX_DEX_ID);
            if (!res.ok) return;
            const data = await res.json();
            
            const fragment = document.createDocumentFragment();
            data.results.forEach(p => {
                const option = document.createElement('option');
                // Formata "marill" para "Marill"
                const formattedName = p.name.charAt(0).toUpperCase() + p.name.slice(1);
                option.value = formattedName;
                fragment.appendChild(option);
            });
            els.datalist.appendChild(fragment);
        } catch (e) {
            // Falha silenciosa se não carregar as sugestões
        }
    }

    async function fetchPokemon(id) {
        const [pokeRes, speciesRes] = await Promise.all([
            fetch('https://pokeapi.co/api/v2/pokemon/' + id),
            fetch('https://pokeapi.co/api/v2/pokemon-species/' + id)
        ]);
        if (!pokeRes.ok || !speciesRes.ok) throw new Error('fetch fail');
        const poke = await pokeRes.json();
        const species = await speciesRes.json();

        const nameEn = (species.names.find(n => n.language.name === 'en') || {}).name || poke.name;
        const namePtEntry = species.names.find(n => n.language.name === 'pt-BR' || n.language.name === 'pt');
        const namePt = namePtEntry ? namePtEntry.name : nameEn;

        const artwork = (poke.sprites.other && poke.sprites.other['official-artwork'] && poke.sprites.other['official-artwork'].front_default)
            || poke.sprites.front_default;

        return {
            id: poke.id,
            nameEn,
            namePt,
            displayName: namePt,
            color: species.color ? species.color.name : '',
            generation: species.generation ? species.generation.name : '',
            types: poke.types.map(t => t.type.name),
            imgUrl: artwork
        };
    }

    function buildScreenImage(imgUrl) {
        if (!els.holder) return;
        
        els.holder.innerHTML =
            '<img id="poke-img" src="' + imgUrl + '" class="hidden-img" alt="Silhueta de Pokémon">' +
            '<div class="sweep" id="sweep-el"></div>';
            
        const img = document.getElementById('poke-img');
        if (img) {
            img.onload = () => { 
                img.classList.remove('hidden-img');
                if (state.solved || state.giveUp) {
                    img.classList.add('revealed');
                }
            };
            img.onerror = () => { showError('IMAGEM NÃO<br>ENCONTRADA'); };
        }
    }

    async function init() {
        if (els.dateLabel) els.dateLabel.textContent = dateLabelText();
        const dateStr = todayKey();
        const id = dailyId(dateStr);
        if (els.dexNum) els.dexNum.textContent = String(id).padStart(4, '0');

        if (els.holder) els.holder.innerHTML = '<div class="loading-txt" id="loading-txt">CARREGANDO<br>DADOS DO<br>POKÉMON...</div>';

        // Carrega sugestões do autocomplete sem travar a inicialização do jogo
        loadPokemonSuggestions();

        // load streak
        const savedStreak = await safeStorageGet('streak');
        if (savedStreak) streakData = savedStreak;
        renderStats();

        let data;
        try {
            data = await fetchPokemon(id);
        } catch (err) {
            showError('NÃO FOI POSSÍVEL<br>CARREGAR O<br>POKÉMON DE HOJE');
            return;
        }

        state = {
            id,
            dateStr,
            nameEn: data.nameEn,
            namePt: data.namePt,
            displayName: data.displayName,
            color: data.color,
            generation: data.generation,
            types: data.types,
            imgUrl: data.imgUrl,
            solved: false,
            giveUp: false,
            tries: [],
            hintsRevealed: []
        };

        // restore saved day progress if exists
        const savedDay = await safeStorageGet('day:' + dateStr);
        if (savedDay && savedDay.id === id) {
            state.solved = !!savedDay.solved;
            state.giveUp = !!savedDay.giveUp;
            state.tries = savedDay.tries || [];
            state.hintsRevealed = savedDay.hintsRevealed || [];
        }

        buildScreenImage(state.imgUrl);
        renderTries();
        applyHintButtonState();

        if (els.input) els.input.disabled = false;
        if (els.guessBtn) els.guessBtn.disabled = false;
        if (els.desBtn) els.desBtn.disabled = false;

        if (state.solved || state.giveUp) {
            setTimeout(() => {
                markSolvedUI(state.giveUp);
            }, 60);
        }
    }

    init();
})();