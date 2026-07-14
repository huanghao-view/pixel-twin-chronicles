"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Series = "mario" | "zelda";
type TimelineFilter = "all" | Series | "era";
type CharacterRole = "hero" | "ally" | "royal" | "rival" | "guide";
type CharacterFilter = "all" | Series | "hero" | "ally" | "rival";
type SeriesFocus = "all" | Series;
type AudioTrack = Series;

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const assetPath = (path: string) => `${basePath}${path}`;

type Game = {
  year: number;
  title: string;
  en: string;
  platform: string;
  note: string;
  series: Series;
  tag: string;
  glyph: string;
};

type Character = {
  id: string;
  name: string;
  en: string;
  series: Series;
  role: CharacterRole;
  roleLabel: string;
  image: string;
  debut: number;
  debutWork: string;
  ability: string;
  copy: string;
  accent: string;
};

type MapConnector = {
  from: [number, number];
  target: [number, number];
};

type MapPlace = {
  name: string;
  top: number;
  target: [number, number];
};

const archiveMusic = {
  mario: {
    stepMs: 164,
    melody: [72, 76, 79, 84, 79, 76, 74, 77, 81, 86, 81, 77, 76, 79, 83, 88],
    bass: [48, null, 55, null, 50, null, 57, null, 53, null, 60, null, 55, null, 62, null],
  },
  zelda: {
    stepMs: 276,
    melody: [55, 62, 67, 71, 67, 62, 57, 64, 69, 72, 69, 64, 59, 66, 71, 74],
    bass: [43, null, null, 50, null, null, 45, null, null, 52, null, null, 47, null, null, 54],
  },
} satisfies Record<AudioTrack, { stepMs: number; melody: (number | null)[]; bass: (number | null)[] }>;

function midiFrequency(note: number) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function createArchiveAudioEngine() {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let timer: number | null = null;
  let track: AudioTrack = "mario";
  let step = 0;

  const playVoice = (note: number | null, wave: OscillatorType, volume: number, duration: number) => {
    if (note === null || !context || !master) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const now = context.currentTime + 0.015;
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(midiFrequency(note), now);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.025);
  };

  const tick = () => {
    const pattern = archiveMusic[track];
    const index = step % pattern.melody.length;
    const duration = Math.max(0.09, pattern.stepMs / 1000 * 0.78);
    playVoice(pattern.melody[index], track === "mario" ? "square" : "triangle", track === "mario" ? 0.035 : 0.042, duration);
    playVoice(pattern.bass[index], "triangle", 0.022, duration * 1.15);
    step += 1;
  };

  const restartTimer = () => {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    if (!context || context.state !== "running") return;
    tick();
    timer = window.setInterval(tick, archiveMusic[track].stepMs);
  };

  return {
    async start(nextTrack: AudioTrack) {
      track = nextTrack;
      if (!context) {
        context = new AudioContext();
        master = context.createGain();
        master.gain.value = 0.55;
        master.connect(context.destination);
      }
      await context.resume();
      if (master) {
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(0.55, context.currentTime, 0.04);
      }
      step = 0;
      restartTimer();
      return context.state === "running";
    },
    setTrack(nextTrack: AudioTrack) {
      if (track === nextTrack) return;
      track = nextTrack;
      step = 0;
      restartTimer();
    },
    stop() {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
      if (context && master) {
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(0.0001, context.currentTime, 0.035);
      }
    },
    destroy() {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
      void context?.close();
      context = null;
      master = null;
    },
  };
}

const marioGames: Game[] = [
  { year: 1981, title: "大金刚", en: "DONKEY KONG", platform: "街机", note: "尚名为 Jumpman 的马力欧首次登场，跳跃成为此后四十余年不断变化的核心动作。", series: "mario", tag: "起点", glyph: "▦" },
  { year: 1985, title: "超级马力欧兄弟", en: "SUPER MARIO BROS.", platform: "FC / NES", note: "横向卷轴、隐藏砖块与精准跳跃共同写下平台动作游戏最重要的一套语法。", series: "mario", tag: "奠基", glyph: "★" },
  { year: 1988, title: "超级马力欧兄弟 3", en: "SUPER MARIO BROS. 3", platform: "FC / NES", note: "地图、变身与关卡主题全面扩张，系列第一次显得如此丰盛而完整。", series: "mario", tag: "扩张", glyph: "▰" },
  { year: 1996, title: "超级马力欧 64", en: "SUPER MARIO 64", platform: "Nintendo 64", note: "摇杆控制、自由镜头与三维移动，重写了玩家在 3D 世界里行动的方式。", series: "mario", tag: "3D 革命", glyph: "◆" },
  { year: 2002, title: "超级马力欧阳光", en: "SUPER MARIO SUNSHINE", platform: "GameCube", note: "水泵装置与热带岛屿，为移动系统加入清洁、悬停和水流的实验。", series: "mario", tag: "实验", glyph: "✣" },
  { year: 2007, title: "超级马力欧银河", en: "SUPER MARIO GALAXY", platform: "Wii", note: "微型星球与重力方向，把“向前跑”变成环绕宇宙的运动。", series: "mario", tag: "重力", glyph: "✦" },
  { year: 2017, title: "超级马力欧 奥德赛", en: "SUPER MARIO ODYSSEY", platform: "Nintendo Switch", note: "帽子附身让敌人、物体乃至世界本身都成为可以借用的能力。", series: "mario", tag: "旅行", glyph: "▱" },
  { year: 2023, title: "超级马力欧兄弟 惊奇", en: "SUPER MARIO BROS. WONDER", platform: "Nintendo Switch", note: "惊奇花让关卡规则随时突变，传统横版再次获得不可预测感。", series: "mario", tag: "惊奇", glyph: "☀" },
];

const zeldaGames: Game[] = [
  { year: 1986, title: "塞尔达传说", en: "THE LEGEND OF ZELDA", platform: "FC / NES", note: "从第一屏起就允许选择方向；探索、发现与记忆共同组成冒险。", series: "zelda", tag: "起点", glyph: "▯" },
  { year: 1998, title: "时之笛", en: "OCARINA OF TIME", platform: "Nintendo 64", note: "Z 注视、三维迷宫与时间切换，为 3D 动作冒险建立范式。", series: "zelda", tag: "时之勇者", glyph: "▲" },
  { year: 2006, title: "黄昏公主", en: "TWILIGHT PRINCESS", platform: "Wii / GameCube", note: "狼形态与黄昏领域，构成系列最具暗色史诗感的篇章之一。", series: "zelda", tag: "黄昏", glyph: "⌂" },
  { year: 2017, title: "旷野之息", en: "BREATH OF THE WILD", platform: "Switch / Wii U", note: "物理、化学与地形组成开放系统，问题不再只有一种答案。", series: "zelda", tag: "旷野", glyph: "⌁" },
  { year: 2023, title: "王国之泪", en: "TEARS OF THE KINGDOM", platform: "Nintendo Switch", note: "天空、地表、地底与究极手，把创造本身变成新的解谜方式。", series: "zelda", tag: "创造", glyph: "◈" },
];

const characters: Character[] = [
  { id: "mario", name: "马力欧", en: "MARIO", series: "mario", role: "hero", roleLabel: "主角", image: assetPath("/characters/mario.webp"), debut: 1981, debutWork: "大金刚", ability: "跳跃冲顶", copy: "以跳跃改变世界的水管工。从砖块、赛车到银河，他总能迅速理解并驾驭新的规则。", accent: "#ff5353" },
  { id: "luigi", name: "路易吉", en: "LUIGI", series: "mario", role: "ally", roleLabel: "伙伴", image: assetPath("/characters/luigi.webp"), debut: 1983, debutWork: "马力欧兄弟", ability: "高跳滞空", copy: "马力欧的高个弟弟。胆怯并不妨碍勇敢，他在鬼屋里拥有最鲜明的个人舞台。", accent: "#55d476" },
  { id: "peach", name: "桃花公主", en: "PRINCESS PEACH", series: "mario", role: "royal", roleLabel: "主角", image: assetPath("/characters/peach.webp"), debut: 1985, debutWork: "超级马力欧兄弟", ability: "漂浮与治愈", copy: "蘑菇王国的核心人物。她从等待救援的公主，逐渐成为能够独立行动的冒险者。", accent: "#ff86b4" },
  { id: "bowser", name: "库巴", en: "BOWSER", series: "mario", role: "rival", roleLabel: "对手", image: assetPath("/characters/bowser.webp"), debut: 1985, debutWork: "超级马力欧兄弟", ability: "火焰轰击", copy: "龟族之王与马力欧的头号对手。喷火、蛮力与夸张野心使他成为永不缺席的终点。", accent: "#f0b641" },
  { id: "link", name: "林克", en: "LINK", series: "zelda", role: "hero", roleLabel: "主角", image: assetPath("/characters/link.webp"), debut: 1986, debutWork: "塞尔达传说", ability: "剑术精通", copy: "跨越多个时代、由不同人物继承的勇者之名。精通剑技，擅长探索与解谜，以勇气与智慧守护世界的平衡。", accent: "#55e080" },
  { id: "zelda", name: "塞尔达", en: "PRINCESS ZELDA", series: "zelda", role: "royal", roleLabel: "主角", image: assetPath("/characters/zelda.webp"), debut: 1986, debutWork: "塞尔达传说", ability: "智慧与封印", copy: "海拉鲁公主与智慧的继承者。她可以是学者、忍者、女神转世，也终于成为冒险的主角。", accent: "#e9c95b" },
  { id: "ganondorf", name: "盖侬多夫", en: "GANONDORF", series: "zelda", role: "rival", roleLabel: "对手", image: assetPath("/characters/ganondorf.webp"), debut: 1998, debutWork: "时之笛", ability: "力量支配", copy: "持有力量三角的格鲁德之王。他在不同纪元以盖侬或盖侬多夫之姿反复归来。", accent: "#a76bec" },
  { id: "impa", name: "英帕", en: "IMPA", series: "zelda", role: "guide", roleLabel: "伙伴", image: assetPath("/characters/impa.webp"), debut: 1986, debutWork: "塞尔达传说", ability: "忍术与守护", copy: "希卡族的守护者之名。每个时代的英帕形象不同，却始终传承知识、守护王族并指引勇者。", accent: "#81b9ff" },
];

const navItems = [
  { id: "home", label: "总览" },
  { id: "timeline", label: "历代时间轴" },
  { id: "characters", label: "人物图鉴" },
  { id: "worlds", label: "世界观" },
] as const;

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function TwinMark() {
  return (
    <span className="twin-mark" aria-hidden="true">
      <span className="pixel-star red-star">★</span>
      <span className="pixel-star green-star">★</span>
    </span>
  );
}

function ArchiveAudioControl({ track }: { track: AudioTrack }) {
  const engineRef = useRef<ReturnType<typeof createArchiveAudioEngine> | null>(null);
  const trackRef = useRef(track);
  const wantedRef = useRef(true);
  const [wanted, setWanted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    trackRef.current = track;
    engineRef.current?.setTrack(track);
  }, [track]);

  useEffect(() => {
    const stored = window.localStorage.getItem("pixel-archive-music");
    const shouldPlay = stored !== "off";
    wantedRef.current = shouldPlay;
    const syncPreference = window.setTimeout(() => setWanted(shouldPlay), 0);

    const startFromFirstGesture = () => {
      if (!wantedRef.current) return;
      if (!engineRef.current) engineRef.current = createArchiveAudioEngine();
      void engineRef.current.start(trackRef.current)
        .then((isPlaying) => window.setTimeout(() => setPlaying(isPlaying), 0))
        .catch(() => window.setTimeout(() => setPlaying(false), 0));
    };

    window.addEventListener("click", startFromFirstGesture, { once: true });
    return () => {
      window.clearTimeout(syncPreference);
      window.removeEventListener("click", startFromFirstGesture);
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  const toggleAudio = () => {
    if (playing) {
      engineRef.current?.stop();
      wantedRef.current = false;
      setWanted(false);
      setPlaying(false);
      window.localStorage.setItem("pixel-archive-music", "off");
      return;
    }

    wantedRef.current = true;
    setWanted(true);
    window.localStorage.setItem("pixel-archive-music", "on");
    if (!engineRef.current) engineRef.current = createArchiveAudioEngine();
    void engineRef.current.start(trackRef.current).then(setPlaying).catch(() => setPlaying(false));
  };

  const status = playing ? "开" : wanted ? "待启" : "关";
  const trackName = track === "mario" ? "红色轨道" : "绿色轨道";

  return (
    <button
      className={`audio-control ${playing ? "playing" : ""} ${track}`}
      onClick={toggleAudio}
      aria-label={`${trackName}原创 8-bit 配乐，当前${status}`}
      title={`${trackName}原创 8-bit 配乐；浏览器首次播放需点击页面`}
      data-track={track}
      data-playing={playing ? "true" : "false"}
    >
      <span className="audio-level" aria-hidden="true"><i /><i /><i /></span>
      <span>声音：{status}</span>
    </button>
  );
}

function SiteHeader({ active, onSearch, musicTrack }: { active: string; onSearch: () => void; musicTrack: AudioTrack }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={() => scrollToSection("home")} aria-label="返回总览">
        <TwinMark />
        <span className="brand-name">任天堂双星纪年</span>
      </button>
      <nav aria-label="主要导航">
        {navItems.map((item) => (
          <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => scrollToSection(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <button className="search-jump" onClick={onSearch} aria-label="跳转到人物搜索">
          <span aria-hidden="true">⌕</span>
        </button>
        <ArchiveAudioControl track={musicTrack} />
      </div>
    </header>
  );
}

function GameCard({ game, onOpen }: { game: Game; onOpen: (game: Game) => void }) {
  return (
    <button className={`game-card ${game.series}`} onClick={() => onOpen(game)} aria-label={`查看 ${game.title} 详细档案`}>
      <span className="game-year">{game.year}</span>
      <strong>{game.title}</strong>
      <small>{game.en}</small>
      <span className="card-rule" />
      <span className="game-card-bottom">
        <b className="game-glyph" aria-hidden="true">{game.glyph}</b>
        <span>平台: {game.platform}</span>
      </span>
      <span className="archive-dots" aria-hidden="true"><i /><i /><i /><i /></span>
    </button>
  );
}

function TimelineSection({ onOpen, onSeriesFocus }: { onOpen: (game: Game) => void; onSeriesFocus: (focus: SeriesFocus) => void }) {
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const showMario = filter !== "zelda";
  const showZelda = filter !== "mario";

  return (
    <section id="timeline" data-section className="page-section timeline-section">
      <div className="section-heading timeline-heading">
        <div>
          <span className="heading-pixels" aria-hidden="true">✣</span>
          <h2>历代时间轴</h2>
          <span className="heading-pixels right" aria-hidden="true">✣</span>
        </div>
        <div className="archive-meta" aria-label="档案信息">
          <span>✦ 档案编号　1981—2024</span>
          <span>⬡ 馆藏状态　公开</span>
        </div>
      </div>

      <div className="timeline-controls" role="group" aria-label="时间轴筛选">
        {([
          ["all", "全部"],
          ["mario", "红色轨道"],
          ["zelda", "绿色轨道"],
          ["era", "主机世代"],
        ] as [TimelineFilter, string][]).map(([value, label]) => (
          <button key={value} className={`${value} ${filter === value ? "selected" : ""}`} onClick={() => { setFilter(value); onSeriesFocus(value === "mario" || value === "zelda" ? value : "all"); }}>
            {label}
          </button>
        ))}
      </div>

      <div className="timeline-frame">
        <div className="timeline-canvas">
          <div className="year-axis">
            <span className="axis-label">年份</span>
            {marioGames.map((game) => <span key={game.year}>{game.year}</span>)}
          </div>

          <div className={`rail-row mario-row ${showMario ? "visible" : "muted"}`}>
            <div className="rail-label mario-label"><b>马力欧</b><span>····</span></div>
            <div className="cards-track mario-track">
              {marioGames.map((game) => <GameCard key={game.year} game={game} onOpen={onOpen} />)}
            </div>
          </div>

          <div className={`rail-row zelda-row ${showZelda ? "visible" : "muted"}`}>
            <div className="rail-label zelda-label"><b>塞尔达传说</b><span>····</span></div>
            <div className="cards-track zelda-track">
              {zeldaGames.map((game, index) => (
                <div className={`zelda-slot slot-${index + 1}`} key={game.year}>
                  <GameCard game={game} onOpen={onOpen} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="timeline-footer-grid">
        <div><h3>图例说明</h3><p><span className="legend-line red" />马力欧轨道　 <span className="legend-node" />年份节点</p><p><span className="legend-line green" />塞尔达轨道　 <span className="legend-coin">●</span>重要作品</p></div>
        <div><h3>轨道状态</h3><p className="meter red-meter"><b>马力欧轨道</b><span>████████████████</span> 8/8</p><p className="meter green-meter"><b>塞尔达轨道</b><span>██████████</span> 5/5</p></div>
        <div><h3>馆藏提示</h3><p>✦ 点击作品卡片可查看详细档案</p><p>▣ 时间轴可左右滚动查看更多条目</p></div>
      </div>
    </section>
  );
}

function CharacterCard({ character, selected, onSelect }: { character: Character; selected: boolean; onSelect: (character: Character) => void }) {
  return (
    <button
      className={`character-card ${character.series} ${selected ? "selected" : ""}`}
      style={{ "--character-accent": character.accent } as React.CSSProperties}
      onClick={() => onSelect(character)}
      aria-pressed={selected}
    >
      <span className="card-corner" aria-hidden="true">✣</span>
      <span className="portrait-stage">
        <img src={character.image} alt={`${character.name}角色形象`} />
        <span className="portrait-scan" />
      </span>
      <strong>{character.name}</strong>
      <small>{character.en}</small>
      <span className="character-stats"><b>▣　初登场</b><em>{character.debut}</em></span>
      <span className="character-stats"><b>⬡　阵营</b><em>{character.series === "mario" ? "红色轨道" : "绿色轨道"}</em></span>
      <span className="character-stats"><b>★　代表能力</b><em>{character.ability}</em></span>
    </button>
  );
}

function CharacterDetail({ character }: { character: Character }) {
  const [tab, setTab] = useState<"detail" | "archive">("detail");
  return (
    <aside className={`character-detail ${character.series}`} style={{ "--character-accent": character.accent } as React.CSSProperties}>
      <div className="detail-tabs">
        <button className={tab === "detail" ? "active" : ""} onClick={() => setTab("detail")}>详情</button>
        <button className={tab === "archive" ? "active" : ""} onClick={() => setTab("archive")}>档案</button>
        <span aria-hidden="true">⌄</span>
      </div>
      <div className="detail-portrait">
        <img src={character.image} alt={`${character.name}大幅角色形象`} />
      </div>
      <h3><span>◇</span>{character.name}<span>◇</span></h3>
      {tab === "detail" ? (
        <div className="detail-panel">
          <p><b>▣　初登场</b><em>{character.debut}</em></p>
          <small>初登场作品　{character.debutWork}</small>
          <p><b>⬡　阵营</b><em>{character.series === "mario" ? "红色轨道" : "绿色轨道"}</em></p>
          <p><b>★　代表能力</b><em>{character.ability}</em></p>
          <blockquote>{character.copy}</blockquote>
        </div>
      ) : (
        <div className="detail-panel archive-copy">
          <p><b>档案代号</b><em>{character.en}</em></p>
          <p><b>角色定位</b><em>{character.roleLabel}</em></p>
          <blockquote>该人物档案以系列代表形象与主要叙事定位为准；不同作品中的身份、年龄与经历可能有所变化。</blockquote>
        </div>
      )}
      <div className="balance-line"><span>红色轨道</span><i /><b>⚖</b><i /><span>绿色轨道</span></div>
    </aside>
  );
}

function CharactersSection({ searchRef, onSeriesFocus }: { searchRef: React.RefObject<HTMLInputElement | null>; onSeriesFocus: (focus: SeriesFocus) => void }) {
  const [filter, setFilter] = useState<CharacterFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"debut" | "name">("debut");
  const [selected, setSelected] = useState<Character>(characters[4]);

  const visibleCharacters = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const filtered = characters.filter((character) => {
      const seriesMatch = filter === "all" || filter === character.series;
      const roleMatch = filter === "hero" ? ["hero", "royal"].includes(character.role) : filter === "ally" ? ["ally", "guide"].includes(character.role) : filter === "rival" ? character.role === "rival" : true;
      const queryMatch = !normalized || `${character.name} ${character.en} ${character.debutWork} ${character.ability}`.toLocaleLowerCase().includes(normalized);
      return seriesMatch && roleMatch && queryMatch;
    });
    return [...filtered].sort((a, b) => sort === "debut" ? a.debut - b.debut : a.name.localeCompare(b.name, "zh-CN"));
  }, [filter, query, sort]);

  const activeCharacter = visibleCharacters.find((character) => character.id === selected.id) ?? visibleCharacters[0] ?? selected;

  return (
    <section id="characters" data-section className="page-section characters-section">
      <div className="characters-title-row">
        <div className="section-heading character-heading"><span className="heading-pixels" aria-hidden="true">✣</span><h2>人物图鉴</h2><span className="dual-line" /></div>
        <label className="character-search">
          <span aria-hidden="true">⌕</span>
          <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索人物、阵营或初登场作品" />
        </label>
      </div>

      <div className="character-toolbar">
        <div className="character-filters" role="group" aria-label="人物筛选">
          {([
            ["all", "全部"], ["mario", "马力欧系列"], ["zelda", "塞尔达系列"], ["hero", "主角"], ["ally", "伙伴"], ["rival", "对手"],
          ] as [CharacterFilter, string][]).map(([value, label]) => <button key={value} className={`${value} ${filter === value ? "selected" : ""}`} onClick={() => { setFilter(value); onSeriesFocus(value === "mario" || value === "zelda" ? value : "all"); }}>{label}</button>)}
        </div>
        <span className="character-count">共 {visibleCharacters.length} 人物</span>
        <label className="sort-select">排序
          <select value={sort} onChange={(event) => setSort(event.target.value as "debut" | "name")}>
            <option value="debut">按初登场</option>
            <option value="name">按名称</option>
          </select>
        </label>
      </div>

      <div className="characters-layout">
        <div className="characters-grid">
          {visibleCharacters.map((character) => <CharacterCard key={character.id} character={character} selected={activeCharacter.id === character.id} onSelect={(nextCharacter) => { setSelected(nextCharacter); onSeriesFocus(nextCharacter.series); }} />)}
          {!visibleCharacters.length && <div className="empty-result">没有找到匹配的人物档案。</div>}
        </div>
        <CharacterDetail character={activeCharacter} />
      </div>
    </section>
  );
}

function MapConnectorCanvas({ connectors, accent }: { connectors: MapConnector[]; accent: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      context.lineWidth = 1.5;
      context.strokeStyle = "rgba(230, 239, 239, .9)";
      context.lineJoin = "miter";
      context.lineCap = "square";

      connectors.forEach(({ from, target }) => {
        const isLeft = from[0] < 0.5;
        const elbowX = (isLeft ? 0.245 : 0.755) * rect.width;
        const nearX = (target[0] + (isLeft ? -0.028 : 0.028)) * rect.width;
        const startX = from[0] * rect.width;
        const startY = from[1] * rect.height;
        const targetX = target[0] * rect.width;
        const targetY = target[1] * rect.height;

        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(elbowX, startY);
        context.lineTo(nearX, targetY);
        context.lineTo(targetX, targetY);
        context.stroke();

        context.save();
        context.shadowColor = accent;
        context.shadowBlur = 11;
        context.fillStyle = accent;
        context.fillRect(targetX - 3.5, targetY - 3.5, 7, 7);
        context.strokeStyle = "rgba(240, 246, 242, .9)";
        context.lineWidth = 1;
        context.strokeRect(targetX - 7.5, targetY - 7.5, 15, 15);
        context.restore();
      });
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [accent, connectors]);

  return <canvas ref={canvasRef} className="map-connector-canvas" aria-hidden="true" />;
}

function WorldMapPanel({ series, title, image, places, annotations }: { series: Series; title: string; image: string; places: MapPlace[]; annotations: boolean }) {
  const leftLabels = series === "mario";
  const connectors = useMemo<MapConnector[]>(() => places.map((place) => ({
    from: [leftLabels ? 0.18 : 0.82, place.top],
    target: place.target,
  })), [leftLabels, places]);

  return (
    <article className={`world-map-panel ${series}`}>
      <h3><span aria-hidden="true">◆</span>{title}<em aria-hidden="true">···</em></h3>
      <div className={`world-map-stage ${annotations ? "annotated" : "plain"}`}>
        <img src={image} alt={`${title}像素地图`} />
        {annotations && <MapConnectorCanvas connectors={connectors} accent={series === "mario" ? "#ff4d49" : "#43d777"} />}
        <div className="map-place-labels" aria-label={`${title}地点标注`}>
          {places.map((place) => (
            <span key={place.name} className="map-place-label" style={{ "--place-top": place.top } as React.CSSProperties}>
              <i aria-hidden="true" />{place.name}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

const marioPlaces: MapPlace[] = [
  { name: "蘑菇城堡", top: 0.16, target: [0.59, 0.18] },
  { name: "水管群岛", top: 0.38, target: [0.33, 0.45] },
  { name: "耀西之岛", top: 0.62, target: [0.33, 0.78] },
  { name: "库巴要塞", top: 0.84, target: [0.70, 0.76] },
];

const zeldaPlaces: MapPlace[] = [
  { name: "海拉鲁城堡", top: 0.16, target: [0.36, 0.17] },
  { name: "迷失森林", top: 0.38, target: [0.17, 0.36] },
  { name: "死亡之山", top: 0.62, target: [0.63, 0.08] },
  { name: "格鲁德沙漠", top: 0.84, target: [0.63, 0.78] },
];

function WorldsSection() {
  const [annotations, setAnnotations] = useState(true);
  const rows = [
    ["世界结构", "由多个主题区域与岛屿组成的线性关卡世界", "大陆与地域交织的高低差开放世界"],
    ["核心冲突", "拯救公主，阻止库巴统治与破坏的野心", "封印灾厄，对抗盖侬与黑暗力量的复苏"],
    ["冒险循环", "进入关卡 → 击败头目 → 获得道具 → 前进", "探索 → 获取能力与道具 → 挑战神庙与地域 → 推进主线"],
    ["力量象征", "星星的祝福与蘑菇的成长", "三角力量的平衡与勇者的意志"],
  ];
  const marioRules = [
    ["星星", "收集星星获得无敌之力，扭转危局。"],
    ["蘑菇", "获得成长与变化，小小力量带来巨大突破。"],
    ["管道", "连接各地的捷径网络，通向未知与惊喜。"],
    ["关卡式区域", "主题鲜明的关卡群，挑战与奖励层层递进。"],
  ];
  const zeldaRules = [
    ["三角力量", "勇气、智慧、力量的平衡，维系世界秩序。"],
    ["轮回", "时间循环与转世的宿命，在传承中重演。"],
    ["神庙", "古老试炼的场所，解锁力量与智慧的证明。"],
    ["开放探索", "广阔世界充满秘密，自由选择自己的道路。"],
  ];

  return (
    <section id="worlds" data-section className="page-section worlds-section">
      <div className="world-archive-heading">
        <span className="archive-line" aria-hidden="true" />
        <div><span aria-hidden="true">[</span><h2>双世界档案</h2><span aria-hidden="true">]</span></div>
        <span className="archive-line right" aria-hidden="true" />
      </div>
      <p className="world-intro">从蘑菇王国到海拉鲁，探索两套不断重生的冒险法则</p>

      <div className="world-map-grid">
        <WorldMapPanel series="mario" title="蘑菇王国" image={assetPath("/worlds/mushroom-kingdom-map.webp")} places={marioPlaces} annotations={annotations} />
        <WorldMapPanel series="zelda" title="海拉鲁" image={assetPath("/worlds/hyrule-map.webp")} places={zeldaPlaces} annotations={annotations} />
      </div>

      <div className="world-comparison-table" aria-label="双世界对照">
        {rows.map(([dimension, mario, zelda]) => (
          <div className="world-comparison-row" key={dimension}>
            <b><i aria-hidden="true" />{dimension}</b><span>{mario}</span><span>{zelda}</span>
          </div>
        ))}
      </div>

      <div className="world-rules-grid">
        <div className="world-rules mario">
          <h3><span />蘑菇王国的世界法则<span /></h3>
          {marioRules.map(([name, copy]) => <div key={name}><b>{name}</b><p>{copy}</p></div>)}
        </div>
        <div className="world-rules zelda">
          <h3><span />海拉鲁的世界法则<span /></h3>
          {zeldaRules.map(([name, copy]) => <div key={name}><b>{name}</b><p>{copy}</p></div>)}
        </div>
      </div>

      <div className="world-footer-bar">
        <div className="world-legend"><b>图例</b><span className="legend-chip mario" />蘑菇王国元素<span className="legend-chip zelda" />海拉鲁元素<span className="legend-chip shared" />共同主题<span className="legend-path" />地点连接路径</div>
        <button onClick={() => setAnnotations((visible) => !visible)} aria-pressed={annotations}><span aria-hidden="true">✣</span>{annotations ? "隐藏地图标注" : "显示地图标注"}</button>
      </div>

      <div className="source-note world-source-note">
        <p>本网站为非官方游戏史档案练习，角色、作品与主题版权归 Nintendo 及相关权利方所有；地图视觉取自本页设计母版。</p>
        <div><a href="https://mario.nintendo.com/history/" target="_blank" rel="noreferrer">马力欧官方历史 ↗</a><a href="https://www.nintendo.com/jp/character/zelda/en/history/index.html" target="_blank" rel="noreferrer">塞尔达官方历史 ↗</a><a href="https://www.nintendo.com/jp/character/zelda/en/characters/index.html" target="_blank" rel="noreferrer">人物档案 ↗</a></div>
      </div>
    </section>
  );
}

function HomeSection() {
  return (
    <section id="home" data-section className="page-section home-section">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-copy">
        <span className="eyebrow">NINTENDO · DUAL CHRONICLE</span>
        <h1>任天堂<br />双星纪年</h1>
        <p>从水管王国到海拉鲁，穿越四十余年的游戏史</p>
        <button className="primary-cta" onClick={() => scrollToSection("timeline")}><span>开始穿越</span><b aria-hidden="true">≫</b></button>
      </div>
      <div className="hero-museum" aria-hidden="true">
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />
        <img src={assetPath("/pixel-twin-hero.webp")} alt="" />
        <div className="museum-plaques"><span /><span /><span /><span /></div>
      </div>
      <div className="home-rail" aria-label="系列起点">
        <div className="origin mario-origin"><span className="coin">M</span><b>1981</b><em>马力欧起点</em></div>
        <div className="origin zelda-origin"><span className="coin">▲</span><b>1986</b><em>海拉鲁起点</em></div>
      </div>
    </section>
  );
}

function GameModal({ game, onClose }: { game: Game | null; onClose: () => void }) {
  useEffect(() => {
    if (!game) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game, onClose]);
  if (!game) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className={`game-modal ${game.series}`} role="dialog" aria-modal="true" aria-labelledby="game-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="关闭档案">×</button>
        <span className="modal-kicker">ARCHIVE / {game.series === "mario" ? "RED TRACK" : "GREEN TRACK"}</span>
        <div className="modal-year">{game.year}</div>
        <h2 id="game-modal-title">{game.title}</h2>
        <h3>{game.en}</h3>
        <div className="modal-glyph" aria-hidden="true">{game.glyph}</div>
        <dl><div><dt>平台</dt><dd>{game.platform}</dd></div><div><dt>档案标签</dt><dd>{game.tag}</dd></div></dl>
        <p>{game.note}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState("home");
  const [openGame, setOpenGame] = useState<Game | null>(null);
  const [musicTrack, setMusicTrack] = useState<AudioTrack>("mario");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const chooseInitialTrack = window.setTimeout(() => setMusicTrack(Math.random() < 0.5 ? "mario" : "zelda"), 0);
    return () => window.clearTimeout(chooseInitialTrack);
  }, []);

  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>("[data-section]")];
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) setActive(visible.target.id);
    }, { rootMargin: "-20% 0px -55%", threshold: [0.1, 0.3, 0.6] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const jumpToSearch = () => {
    scrollToSection("characters");
    window.setTimeout(() => searchRef.current?.focus(), 650);
  };

  const focusSeries = (focus: SeriesFocus) => {
    setMusicTrack(focus === "all" ? (Math.random() < 0.5 ? "mario" : "zelda") : focus);
  };

  const openGameArchive = (game: Game) => {
    focusSeries(game.series);
    setOpenGame(game);
  };

  return (
    <main className="site-shell">
      <SiteHeader active={active} onSearch={jumpToSearch} musicTrack={musicTrack} />
      <HomeSection />
      <TimelineSection onOpen={openGameArchive} onSeriesFocus={focusSeries} />
      <CharactersSection searchRef={searchRef} onSeriesFocus={focusSeries} />
      <WorldsSection />
      <GameModal game={openGame} onClose={() => setOpenGame(null)} />
    </main>
  );
}
