/**
 * FIFA 2026 Interactive Fan Hub - Application State & Simulation Engine
 */

(function () {
  'use strict';

  // ==========================================
  // INITIAL DATA & STORAGE CONSTANTS
  // ==========================================
  const STORAGE_KEYS = {
    VOTES: 'fifa2026_fan_votes_v2_zero',
    USER_VOTED: 'fifa2026_user_voted_team_v2_zero',
    TOKENS: 'fifa2026_user_tokens_v2_zero',
    FEED_HISTORY: 'fifa2026_feed_history_v2_zero'
  };

  // ALL VOTES RESET TO ZERO BEFORE PUBLISHING
  const DEFAULT_TEAMS = [
    { id: 'ARG', name: 'Argentina', flag: '🇦🇷', votes: 0, color: 'from-blue-600 to-cyan-400' },
    { id: 'BRA', name: 'Brazil', flag: '🇧🇷', votes: 0, color: 'from-green-600 to-yellow-400' },
    { id: 'FRA', name: 'France', flag: '🇫🇷', votes: 0, color: 'from-blue-800 to-red-600' },
    { id: 'USA', name: 'USA', flag: '🇺🇸', votes: 0, color: 'from-red-600 to-blue-800' },
    { id: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', votes: 0, color: 'from-red-600 to-white' },
    { id: 'ESP', name: 'Spain', flag: '🇪🇸', votes: 0, color: 'from-red-600 to-yellow-500' },
    { id: 'GER', name: 'Germany', flag: '🇩🇪', votes: 0, color: 'from-gray-900 to-yellow-500' },
    { id: 'POR', name: 'Portugal', flag: '🇵🇹', votes: 0, color: 'from-red-700 to-green-700' }
  ];

  // REAL FIFA UPDATES, YESTERDAY'S MATCH RESULTS & INJURY NEWS
  const MOCK_SIMULATION_EVENTS = [
    { type: 'match', time: "YESTERDAY • FINAL", text: "Yesterday's Match: Argentina 2 - 1 Canada", sub: "Julian Alvarez (12'), Alphonso Davies (44'), Lionel Messi (88'). Hard-fought friendly thriller at Atlanta Mercedes-Benz Stadium!", team: "🏆 RESULT" },
    { type: 'match', time: "YESTERDAY • FINAL", text: "Yesterday's Match: USA 3 - 0 Mexico", sub: "Christian Pulisic brace and Gio Reyna thunderbolt seal dominant rivalry win in front of 82,000 fans in Los Angeles!", team: "🏆 RESULT" },
    { type: 'injury', time: "BREAKING • 08:15 AM", text: "🚨 INJURY BULLETIN: Vinicius Jr. Hamstring Tightness", sub: "Brazil medical staff monitors Vinicius Jr. following intense sprint drills. Scans scheduled at training base.", team: "🇧🇷 BRAZIL" },
    { type: 'news', time: "OFFICIAL • 08:00 AM", text: "🏟️ MetLife Stadium Final FIFA Pitch Inspection Approved", sub: "FIFA delegates confirm immaculate hybrid turf conditions for the New Jersey World Cup Grand Final.", team: "🏛️ FIFA HQ" },
    { type: 'injury', time: "UPDATE • 07:45 AM", text: "🚨 INJURY UPDATE: Alphonso Davies Cleared for Opener", sub: "Hamstring scan returns completely clear; Bayern star resumes full tactical training with Canada squad.", team: "🇨🇦 CANADA" },
    { type: 'goal', time: "LIVE • 14'", text: "GOAL! Spain 1 - 0 Germany", sub: "Lamine Yamal sensational solo run and left-footed curler into top bins!", team: "🇪🇸 SPAIN" },
    { type: 'injury', time: "BULLETIN • 07:10 AM", text: "🚨 INJURY NEWS: Kylian Mbappé Ankle Contusion", sub: "France captain rested from tactical scrimmage after minor collision. Listed as day-to-day precautionary measure.", team: "🇫🇷 FRANCE" },
    { type: 'card', time: "LIVE • 45+2'", text: "RED CARD! England Midfielder Dismissed", sub: "VAR review confirms tactical foul stopping a dangerous USA 3-on-1 breakaway.", team: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND" },
    { type: 'injury', time: "UPDATE • 06:30 AM", text: "🚨 INJURY BULLETIN: Pedri Thigh Strain Assessment", sub: "Spain midfield maestro undergoes physiotherapy; expected back for Group Stage Matchday 2.", team: "🇪🇸 SPAIN" },
    { type: 'news', time: "06:00 AM", text: "🎟️ Official FIFA Resale Ticket Portal Exceeds 2.4M Requests", sub: "Unprecedented global demand recorded across all 16 North American host cities.", team: "🎟️ TICKETS" }
  ];

  // State Variables (RESET TO ZERO)
  let teamsData = [];
  let userTokens = 0; // RESET TO ZERO
  let userVotedTeamId = null;
  let liveFeedEvents = [];
  let currentFilter = 'all';
  let simInterval = null;
  let simSpeedMs = 3000;
  let isSimPaused = false;

  // ==========================================
  // INITIALIZATION
  // ==========================================
  function init() {
    loadStorageData();
    setupNavigation();
    setupVotingUI();
    setupLiveFeedEngine();
    startCountdownClock();
    updateTokenDisplay();

    // Event Listeners for UI Actions
    document.getElementById('resetVotesBtn')?.addEventListener('click', handleResetVotes);
    document.getElementById('shareRankingsBtn')?.addEventListener('click', handleSharePoll);
    document.getElementById('viewAllUpdatesBtn')?.addEventListener('click', () => switchView('updates'));
    document.getElementById('triggerRandomEventBtn')?.addEventListener('click', triggerRandomMatchEvent);
    document.getElementById('clearFeedBtn')?.addEventListener('click', clearLiveFeedHistory);
    
    // MASTER RESET BUTTON TO ZERO OUT EVERYTHING ON DEMAND
    document.querySelectorAll('.master-reset-btn').forEach(b => {
      b.addEventListener('click', resetEverythingToZero);
    });

    // Global helper exposure
    window.addFanTokens = addFanTokens;
    window.showToast = showToast;
    window.resetAllAppletData = resetEverythingToZero;
  }

  // ==========================================
  // MASTER RESET TO ZERO
  // ==========================================
  function resetEverythingToZero() {
    localStorage.removeItem(STORAGE_KEYS.VOTES);
    localStorage.removeItem(STORAGE_KEYS.USER_VOTED);
    localStorage.removeItem(STORAGE_KEYS.TOKENS);
    localStorage.removeItem(STORAGE_KEYS.FEED_HISTORY);
    localStorage.removeItem('fifa2026_minigames_highscores');

    teamsData = JSON.parse(JSON.stringify(DEFAULT_TEAMS));
    userTokens = 0;
    userVotedTeamId = null;
    liveFeedEvents = [...MOCK_SIMULATION_EVENTS];

    saveStorageData();
    renderVotingGrid();
    renderFeeds();
    updateTokenDisplay();

    if (window.reloadMiniGamesScores) window.reloadMiniGamesScores();

    showToast('⚠️ Master Reset Complete: All votes, tokens, and scores reset to 0!', '✨');
  }

  // ==========================================
  // STORAGE HANDLING
  // ==========================================
  function loadStorageData() {
    // 1. Votes
    const storedVotes = localStorage.getItem(STORAGE_KEYS.VOTES);
    if (storedVotes) {
      try {
        teamsData = JSON.parse(storedVotes);
      } catch (e) {
        teamsData = JSON.parse(JSON.stringify(DEFAULT_TEAMS));
      }
    } else {
      teamsData = JSON.parse(JSON.stringify(DEFAULT_TEAMS));
    }

    // 2. User voted team
    userVotedTeamId = localStorage.getItem(STORAGE_KEYS.USER_VOTED);

    // 3. Tokens
    const storedTokens = localStorage.getItem(STORAGE_KEYS.TOKENS);
    if (storedTokens !== null && !isNaN(storedTokens)) {
      userTokens = parseInt(storedTokens, 10);
    } else {
      userTokens = 0;
    }

    // 4. Feed History
    const storedFeed = localStorage.getItem(STORAGE_KEYS.FEED_HISTORY);
    if (storedFeed) {
      try {
        liveFeedEvents = JSON.parse(storedFeed);
      } catch (e) {
        liveFeedEvents = [...MOCK_SIMULATION_EVENTS];
      }
    } else {
      liveFeedEvents = [...MOCK_SIMULATION_EVENTS];
    }
  }

  function saveStorageData() {
    localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(teamsData));
    if (userVotedTeamId) {
      localStorage.setItem(STORAGE_KEYS.USER_VOTED, userVotedTeamId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER_VOTED);
    }
    localStorage.setItem(STORAGE_KEYS.TOKENS, userTokens.toString());
    localStorage.setItem(STORAGE_KEYS.FEED_HISTORY, JSON.stringify(liveFeedEvents));
  }

  // ==========================================
  // NAVIGATION & VIEW ROUTING
  // ==========================================
  function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const viewSections = document.querySelectorAll('.view-section');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.getAttribute('data-view');
        switchView(targetView);
      });
    });

    // Logo click goes home
    document.getElementById('navLogo')?.addEventListener('click', () => switchView('home'));

    // Game launchers from home tab
    document.querySelectorAll('.nav-btn-game').forEach(gameLauncher => {
      gameLauncher.addEventListener('click', () => {
        const targetGame = gameLauncher.getAttribute('data-game');
        switchView('games');
        if (targetGame && window.selectMiniGameTab) {
          window.selectMiniGameTab(targetGame);
        }
      });
    });
  }

  function switchView(viewId) {
    const navButtons = document.querySelectorAll('.nav-btn');
    const viewSections = document.querySelectorAll('.view-section');

    // 1. Hide all sections
    viewSections.forEach(sec => {
      sec.classList.add('hidden');
      sec.classList.remove('active');
    });

    // 2. Show target section
    const activeSec = document.getElementById(`view-${viewId}`);
    if (activeSec) {
      activeSec.classList.remove('hidden');
      activeSec.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 3. Update nav button highlights
    navButtons.forEach(btn => {
      if (btn.getAttribute('data-view') === viewId) {
        btn.classList.add('text-[#00FF66]', 'bg-[#00FF66]/15', 'border-[#00FF66]/40', 'shadow-[0_0_15px_rgba(0,255,102,0.2)]');
        btn.classList.remove('text-gray-400');
      } else {
        btn.classList.remove('text-[#00FF66]', 'bg-[#00FF66]/15', 'border-[#00FF66]/40', 'shadow-[0_0_15px_rgba(0,255,102,0.2)]');
        btn.classList.add('text-gray-400');
      }
    });

    // Notify canvas resizing if switching to games tab
    if (viewId === 'games' && window.triggerGameResize) {
      setTimeout(() => window.triggerGameResize(), 50);
    }
  }

  // ==========================================
  // COUNTDOWN CLOCK
  // ==========================================
  function startCountdownClock() {
    // Target: Opening match June 11, 2026 17:00:00 UTC
    const kickoffDate = new Date('2026-06-11T17:00:00Z').getTime();
    const navClockEl = document.getElementById('navCountdown');
    const mobileClockEl = document.getElementById('mobileCountdown');

    function tick() {
      const now = new Date().getTime();
      const diff = kickoffDate - now;

      if (diff <= 0) {
        if (navClockEl) navClockEl.textContent = "TOURNAMENT LIVE!";
        if (mobileClockEl) mobileClockEl.textContent = "TOURNAMENT LIVE!";
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const formatted = `${days}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;

      if (navClockEl) navClockEl.textContent = formatted;
      if (mobileClockEl) mobileClockEl.textContent = formatted;
    }

    tick();
    setInterval(tick, 1000);
  }

  // ==========================================
  // INTERACTIVE VOTING MODULE
  // ==========================================
  function setupVotingUI() {
    renderVotingGrid();
  }

  function renderVotingGrid() {
    const gridEl = document.getElementById('votingGrid');
    const totalCountEl = document.getElementById('totalVotesCount');
    if (!gridEl) return;

    // Calculate total votes
    const totalVotes = teamsData.reduce((sum, team) => sum + team.votes, 0);
    if (totalCountEl) totalCountEl.textContent = totalVotes.toLocaleString();

    gridEl.innerHTML = '';

    teamsData.forEach(team => {
      const percentage = totalVotes > 0 ? Math.round((team.votes / totalVotes) * 100) : 0;
      const isVoted = (userVotedTeamId === team.id);

      const card = document.createElement('div');
      card.className = `bg-[#0A192F]/90 p-4.5 rounded-2xl border ${isVoted ? 'border-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.3)] bg-[#0A192F]' : 'border-[#1A2E44] hover:border-[#D4AF37]/60'} transition-all group flex flex-col justify-between gap-3.5 relative overflow-hidden`;

      card.innerHTML = `
        <div class="flex justify-between items-center z-10">
          <div class="flex items-center space-x-3.5">
            <span class="text-3xl sm:text-4xl filter drop-shadow group-hover:scale-110 transition-transform">${team.flag}</span>
            <div class="flex flex-col">
              <span class="font-black tracking-tight text-white text-base sm:text-lg group-hover:text-[#00FF66] transition-colors">${team.name}</span>
              <span class="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full ${team.votes > 0 ? 'bg-[#00FF66]' : 'bg-gray-600'}"></span>
                ${team.votes.toLocaleString()} votes
              </span>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <span class="text-[#00FF66] font-mono font-black text-lg">${percentage}%</span>
            <button data-vote="${team.id}" class="vote-btn px-3.5 py-2 ${isVoted ? 'bg-[#00FF66] text-black shadow-[0_0_15px_rgba(0,255,102,0.5)] font-black' : 'bg-[#1A2E44] hover:bg-[#00FF66] hover:text-black text-white font-bold'} text-xs rounded-xl transition-all cursor-pointer shadow-md active:scale-95">
              ${isVoted ? '✓ Voted' : 'Vote'}
            </button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="h-3 bg-[#071224] rounded-full overflow-hidden border border-[#1A2E44] z-10 p-0.5">
          <div class="h-full bg-gradient-to-r ${team.color} transition-all duration-700 ease-out rounded-full shadow-sm" style="width: ${percentage}%"></div>
        </div>
      `;

      gridEl.appendChild(card);
    });

    // Attach vote click listeners
    gridEl.querySelectorAll('.vote-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const teamId = btn.getAttribute('data-vote');
        castVote(teamId);
      });
    });
  }

  function castVote(teamId) {
    const targetTeam = teamsData.find(t => t.id === teamId);
    if (!targetTeam) return;

    // If switching vote from prior team
    if (userVotedTeamId && userVotedTeamId !== teamId) {
      const oldTeam = teamsData.find(t => t.id === userVotedTeamId);
      if (oldTeam && oldTeam.votes > 0) oldTeam.votes--;
    }

    targetTeam.votes++;
    userVotedTeamId = teamId;
    
    saveStorageData();
    renderVotingGrid();
    
    addFanTokens(10);
    showToast(`Voted for ${targetTeam.flag} ${targetTeam.name}! (+10 Reward Tokens)`, '⚽');
  }

  function handleResetVotes() {
    if (!userVotedTeamId) {
      showToast('You have not voted yet (All votes are 0)!', 'ℹ️');
      return;
    }
    const team = teamsData.find(t => t.id === userVotedTeamId);
    if (team && team.votes > 0) team.votes--;
    userVotedTeamId = null;
    saveStorageData();
    renderVotingGrid();
    showToast('Your vote has been reset to zero.', '🔄');
  }

  function handleSharePoll() {
    const votedTeam = teamsData.find(t => t.id === userVotedTeamId);
    const shareText = votedTeam 
      ? `I just voted for ${votedTeam.flag} ${votedTeam.name} to win the FIFA 2026 World Cup on the Interactive Fan Hub!`
      : `Check out the live FIFA 2026 Champion Fan Hub and cast your global vote!`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
      showToast('Poll link & ranking summary copied to clipboard!', '📤');
    } else {
      showToast('Share FIFA 2026 Fan Hub with friends!', '📤');
    }
  }

  // ==========================================
  // TOKEN REWARDS MANAGEMENT
  // ==========================================
  function addFanTokens(amount) {
    userTokens += amount;
    saveStorageData();
    updateTokenDisplay();
  }

  function updateTokenDisplay() {
    const dispEl = document.getElementById('userTokenDisplay');
    if (dispEl) dispEl.textContent = `${userTokens} PTS`;
  }

  // ==========================================
  // LIVE FEED SIMULATION ENGINE
  // ==========================================
  function setupLiveFeedEngine() {
    renderFeeds();

    // Sim speed buttons
    document.querySelectorAll('.sim-speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = parseInt(btn.getAttribute('data-speed'), 10);
        simSpeedMs = speed;
        
        document.querySelectorAll('.sim-speed-btn').forEach(b => b.classList.replace('bg-[#00FF66]', 'bg-[#1A2E44]'));
        document.querySelectorAll('.sim-speed-btn').forEach(b => b.classList.replace('text-black', 'text-gray-300'));
        btn.classList.replace('bg-[#1A2E44]', 'bg-[#00FF66]');
        btn.classList.replace('text-gray-300', 'text-black');

        restartSimulationTimer();
        showToast(`Simulation engine speed set to ${speed / 1000}s`, '⚡');
      });
    });

    // Pause toggle
    document.getElementById('toggleSimBtn')?.addEventListener('click', (e) => {
      isSimPaused = !isSimPaused;
      e.target.textContent = isSimPaused ? '▶️ Resume Feed' : '⏸️ Pause Feed';
      showToast(isSimPaused ? 'Simulation paused' : 'Simulation resumed', '📡');
    });

    // Category Filter buttons
    document.querySelectorAll('.feed-filter').forEach(filterBtn => {
      filterBtn.addEventListener('click', () => {
        currentFilter = filterBtn.getAttribute('data-filter');
        document.querySelectorAll('.feed-filter').forEach(f => {
          f.classList.remove('active', 'bg-[#00FF66]/25', 'text-[#00FF66]', 'border-[#00FF66]/50', 'shadow-md');
          f.classList.add('bg-[#1A2E44]', 'text-gray-400');
        });
        filterBtn.classList.add('active', 'bg-[#00FF66]/25', 'text-[#00FF66]', 'border-[#00FF66]/50', 'shadow-md');
        filterBtn.classList.remove('bg-[#1A2E44]', 'text-gray-400');
        renderFeeds();
      });
    });

    restartSimulationTimer();
  }

  function restartSimulationTimer() {
    if (simInterval) clearInterval(simInterval);
    simInterval = setInterval(() => {
      if (!isSimPaused) {
        pushSimulatedEvent();
      }
    }, simSpeedMs);
  }

  function pushSimulatedEvent() {
    // Generate realistic World Cup match, injury bulletins, or breaking news
    const types = ['goal', 'injury', 'news', 'card', 'goal'];
    const type = types[Math.floor(Math.random() * types.length)];
    const minutes = Math.floor(Math.random() * 90) + 1;
    
    const randomTeam1 = DEFAULT_TEAMS[Math.floor(Math.random() * DEFAULT_TEAMS.length)];
    let randomTeam2 = DEFAULT_TEAMS[Math.floor(Math.random() * DEFAULT_TEAMS.length)];
    while (randomTeam1.id === randomTeam2.id) {
      randomTeam2 = DEFAULT_TEAMS[Math.floor(Math.random() * DEFAULT_TEAMS.length)];
    }

    const s1 = Math.floor(Math.random() * 3) + 1;
    const s2 = Math.floor(Math.random() * 2);

    let newEvent = {};

    if (type === 'goal') {
      const scorers = ['Lionel Messi', 'Vinicius Jr', 'Kylian Mbappé', 'Jude Bellingham', 'Lamine Yamal', 'Christian Pulisic', 'Florian Wirtz', 'Bukayo Saka', 'Jamal Musiala'];
      const scorer = scorers[Math.floor(Math.random() * scorers.length)];
      newEvent = {
        type: 'goal',
        time: `LIVE • ${minutes}'`,
        text: `GOAL! ${randomTeam1.name} ${s1} - ${s2} ${randomTeam2.name}`,
        sub: `Sensational World Cup strike by ${scorer}! Host stadium erupts!`,
        team: `${randomTeam1.flag} ${randomTeam1.id}`
      };
    } else if (type === 'injury') {
      const players = ['Bukayo Saka', 'Rodri', 'Aurelien Tchouameni', 'Enzo Fernandez', 'Weston McKennie', 'Jamal Musiala', 'Ousmane Dembele'];
      const player = players[Math.floor(Math.random() * players.length)];
      const injuries = ['slight calf tightness during morning training', 'precautionary ice wrap after physical challenge', 'minor ankle knock listed day-to-day', 'cleared by team doctor following fitness assessment'];
      const inj = injuries[Math.floor(Math.random() * injuries.length)];
      newEvent = {
        type: 'injury',
        time: `BULLETIN • ${minutes}'`,
        text: `🚨 INJURY NEWS: ${randomTeam1.name} Star ${player}`,
        sub: `Medical update: ${player} experiencing ${inj}.`,
        team: `${randomTeam1.flag} MEDICAL`
      };
    } else if (type === 'card') {
      newEvent = {
        type: 'card',
        time: `LIVE • ${minutes}'`,
        text: `YELLOW CARD! ${randomTeam1.name}`,
        sub: `Tactical foul stopping a quick counter-attack. Referee issues instant caution.`,
        team: `${randomTeam1.flag} ${randomTeam1.id}`
      };
    } else {
      const headlines = [
        "🏟️ Estadio Azteca Opening Ceremony Rehearsals Enter Final Phase",
        "📺 FIFA Connect Reports Record 4.2 Billion Projected Global Viewership",
        "🎉 Toronto Fan Fest Zone Expands Capacity to Accommodate Traveling Fans",
        "⚽ Connected Tournament Ball Micro-Chip Data Validates 112mph Strike"
      ];
      const hd = headlines[Math.floor(Math.random() * headlines.length)];
      newEvent = {
        type: 'news',
        time: `${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
        text: hd,
        sub: "World Cup 2026 fever sweeps across USA, Canada, and Mexico.",
        team: "📰 FIFA NEWS"
      };
    }

    liveFeedEvents.unshift(newEvent);
    if (liveFeedEvents.length > 80) liveFeedEvents.pop(); // Cap history
    
    saveStorageData();
    renderFeeds();
  }

  function triggerRandomMatchEvent() {
    pushSimulatedEvent();
    const latest = liveFeedEvents[0];
    showToast(`🚨 Update: ${latest.text}`, latest.type === 'goal' ? '⚽' : latest.type === 'injury' ? '🏥' : '📢');
  }

  function clearLiveFeedHistory() {
    liveFeedEvents = [...MOCK_SIMULATION_EVENTS];
    saveStorageData();
    renderFeeds();
    showToast('Live updates history reset to fresh zero state', '🧹');
  }

  function renderFeeds() {
    const homePreviewEl = document.getElementById('homeSimFeed');
    const fullFeedEl = document.getElementById('fullLiveFeed');

    // Filter events for full feed
    const filtered = currentFilter === 'all' 
      ? liveFeedEvents 
      : liveFeedEvents.filter(ev => ev.type === currentFilter);

    // 1. Render Home Preview (Top 4 items)
    if (homePreviewEl) {
      homePreviewEl.innerHTML = '';
      liveFeedEvents.slice(0, 4).forEach((ev, idx) => {
        homePreviewEl.appendChild(createFeedCard(ev, idx === 0));
      });
    }

    // 2. Render Full Feed
    if (fullFeedEl) {
      fullFeedEl.innerHTML = '';
      if (filtered.length === 0) {
        fullFeedEl.innerHTML = `<div class="p-8 text-center text-gray-500 font-bold">No updates matching filter "${currentFilter}"</div>`;
      } else {
        filtered.forEach((ev, idx) => {
          fullFeedEl.appendChild(createFeedCard(ev, idx === 0 && currentFilter === 'all'));
        });
      }
    }
  }

  function createFeedCard(ev, isLiveNow) {
    const card = document.createElement('div');
    
    let borderColor = 'border-l-4 border-gray-600 bg-[#0A192F]';
    let dotColor = 'bg-gray-500';
    let titleColor = 'text-white font-bold';

    if (ev.type === 'match') {
      borderColor = 'border-l-4 border-[#D4AF37] bg-gradient-to-r from-[#D4AF37]/20 via-[#0A192F] to-[#0A192F] shadow-[0_4px_25px_rgba(212,175,55,0.2)]';
      dotColor = 'bg-[#D4AF37] animate-ping';
      titleColor = 'text-[#F4D068] font-black text-base italic';
    } else if (ev.type === 'goal') {
      borderColor = 'border-l-4 border-[#00FF66] bg-[#1A2E44]/70 shadow-[0_4px_20px_rgba(0,255,102,0.15)]';
      dotColor = 'bg-[#00FF66] animate-pulse';
      titleColor = 'text-[#00FF66] font-black italic text-base';
    } else if (ev.type === 'injury') {
      borderColor = 'border-l-4 border-red-500 bg-gradient-to-r from-red-500/15 via-[#0A192F] to-[#0A192F] shadow-[0_4px_20px_rgba(239,68,68,0.15)]';
      dotColor = 'bg-red-500 animate-pulse';
      titleColor = 'text-red-400 font-black';
    } else if (ev.type === 'card') {
      borderColor = 'border-l-4 border-yellow-400 bg-[#1A2E44]/50';
      dotColor = 'bg-yellow-400';
      titleColor = 'text-yellow-300 font-bold';
    } else if (ev.type === 'news') {
      borderColor = 'border-l-4 border-cyan-400 bg-[#0A192F]';
      dotColor = 'bg-cyan-400';
      titleColor = 'text-cyan-100 font-bold';
    }

    if (isLiveNow) {
      borderColor += ' ring-1 ring-[#00FF66]/50';
    }

    card.className = `flex space-x-3.5 items-start p-4 rounded-xl transition-all animate-slide-in hover:translate-x-1 ${borderColor}`;

    card.innerHTML = `
      <div class="w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${dotColor}"></div>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-center mb-1">
          <span class="text-[11px] font-mono font-bold ${ev.type === 'goal' ? 'text-[#00FF66]' : ev.type === 'match' ? 'text-[#D4AF37]' : ev.type === 'injury' ? 'text-red-400' : 'text-gray-400'}">${ev.time}</span>
          <span class="text-[10px] font-black px-2 py-0.5 rounded bg-black/60 border border-white/10 text-gray-200 uppercase tracking-wider">${ev.team || 'FIFA'}</span>
        </div>
        <p class="text-sm leading-snug ${titleColor}">${ev.text}</p>
        <p class="text-xs text-gray-300 mt-1 leading-normal font-normal">${ev.sub}</p>
      </div>
    `;

    return card;
  }

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================
  function showToast(message, icon = '⚽') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span class="text-xl">${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

